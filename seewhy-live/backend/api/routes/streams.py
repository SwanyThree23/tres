from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from ...core.database import get_db
from ...core.deps import get_current_user, get_current_user_optional
from ...models.entities import User, Stream, WhyQuestion
from ..schemas import StreamCreate, StreamOut, QuestionCreate, QuestionOut

router = APIRouter(prefix="/streams", tags=["streams"])


def _stream_out(stream: Stream) -> StreamOut:
    return StreamOut(
        id=stream.id,
        title=stream.title,
        description=stream.description,
        category=stream.category,
        tags=stream.tags_list,
        creator_id=stream.creator_id,
        creator_username=stream.creator.username,
        creator_display_name=stream.creator.display_name,
        creator_avatar_url=stream.creator.avatar_url,
        is_live=stream.is_live,
        viewer_count=stream.viewer_count,
        peak_viewer_count=stream.peak_viewer_count,
        hls_url=stream.hls_url,
        thumbnail_url=stream.thumbnail_url,
        started_at=stream.started_at,
        created_at=stream.created_at,
    )


async def _get_stream_or_404(stream_id: str, db: AsyncSession) -> Stream:
    result = await db.execute(
        select(Stream).options(selectinload(Stream.creator)).where(Stream.id == stream_id)
    )
    stream = result.scalar_one_or_none()
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")
    return stream


@router.get("", response_model=list[StreamOut])
async def list_streams(
    search: str | None = Query(None),
    category: str | None = Query(None),
    live_only: bool = Query(False),
    page: int = Query(1, ge=1),
    per_page: int = Query(24, le=50),
    db: AsyncSession = Depends(get_db),
    _: User | None = Depends(get_current_user_optional),
):
    q = select(Stream).options(selectinload(Stream.creator)).order_by(Stream.viewer_count.desc(), Stream.created_at.desc())

    if search:
        q = q.where(or_(
            Stream.title.ilike(f"%{search}%"),
            Stream.description.ilike(f"%{search}%"),
        ))
    if category:
        q = q.where(Stream.category == category)
    if live_only:
        q = q.where(Stream.status == "live")
    else:
        q = q.where(Stream.status.in_(["live", "ended"]))

    q = q.offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(q)
    return [_stream_out(s) for s in result.scalars().all()]


@router.get("/featured", response_model=list[StreamOut])
async def featured_streams(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Stream)
        .options(selectinload(Stream.creator))
        .where(Stream.status == "live")
        .order_by(Stream.viewer_count.desc())
        .limit(8)
    )
    streams = result.scalars().all()
    if not streams:
        # Fallback to recent
        result = await db.execute(
            select(Stream)
            .options(selectinload(Stream.creator))
            .where(Stream.status == "ended")
            .order_by(Stream.created_at.desc())
            .limit(8)
        )
        streams = result.scalars().all()
    return [_stream_out(s) for s in streams]


@router.get("/trending", response_model=list[StreamOut])
async def trending_streams(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Stream)
        .options(selectinload(Stream.creator))
        .where(Stream.status.in_(["live", "ended"]))
        .order_by(Stream.peak_viewer_count.desc())
        .limit(12)
    )
    return [_stream_out(s) for s in result.scalars().all()]


@router.get("/mine", response_model=list[StreamOut])
async def my_streams(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Stream)
        .options(selectinload(Stream.creator))
        .where(Stream.creator_id == current_user.id)
        .order_by(Stream.created_at.desc())
    )
    return [_stream_out(s) for s in result.scalars().all()]


@router.get("/{stream_id}", response_model=StreamOut)
async def get_stream(stream_id: str, db: AsyncSession = Depends(get_db)):
    return _stream_out(await _get_stream_or_404(stream_id, db))


@router.post("", response_model=StreamOut, status_code=status.HTTP_201_CREATED)
async def create_stream(
    body: StreamCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stream = Stream(
        creator_id=current_user.id,
        title=body.title,
        description=body.description,
        category=body.category,
        tags=",".join(body.tags),
    )
    db.add(stream)
    current_user.stream_count += 1
    await db.commit()
    await db.refresh(stream)
    await db.refresh(current_user)
    # Re-load with creator
    return _stream_out(await _get_stream_or_404(stream.id, db))


@router.post("/{stream_id}/go-live", response_model=StreamOut)
async def go_live(
    stream_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stream = await _get_stream_or_404(stream_id, db)
    if stream.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your stream")
    stream.status = "live"
    stream.started_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(stream)
    return _stream_out(await _get_stream_or_404(stream.id, db))


@router.post("/{stream_id}/end", response_model=StreamOut)
async def end_stream(
    stream_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stream = await _get_stream_or_404(stream_id, db)
    if stream.creator_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not your stream")
    stream.status = "ended"
    stream.ended_at = datetime.now(timezone.utc)
    stream.viewer_count = 0
    await db.commit()
    return _stream_out(await _get_stream_or_404(stream.id, db))


# ── Why Questions ─────────────────────────────────────────────────────────────

@router.get("/{stream_id}/questions", response_model=list[QuestionOut])
async def list_questions(stream_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(WhyQuestion)
        .options(selectinload(WhyQuestion.author))
        .where(WhyQuestion.stream_id == stream_id)
        .order_by(WhyQuestion.upvotes.desc(), WhyQuestion.created_at.desc())
    )
    questions = result.scalars().all()
    return [
        QuestionOut(
            id=q.id,
            stream_id=q.stream_id,
            user_id=q.user_id,
            username=q.author.username,
            display_name=q.author.display_name,
            question=q.question,
            upvotes=q.upvotes,
            ai_answer=q.ai_answer,
            is_answered=q.is_answered,
            created_at=q.created_at,
        )
        for q in questions
    ]


@router.post("/{stream_id}/questions", response_model=QuestionOut, status_code=status.HTTP_201_CREATED)
async def ask_question(
    stream_id: str,
    body: QuestionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stream = await _get_stream_or_404(stream_id, db)
    if not stream.is_live:
        raise HTTPException(status_code=400, detail="Stream is not live")

    q = WhyQuestion(
        stream_id=stream_id,
        user_id=current_user.id,
        question=body.question,
    )
    db.add(q)
    await db.commit()
    await db.refresh(q)
    return QuestionOut(
        id=q.id,
        stream_id=q.stream_id,
        user_id=q.user_id,
        username=current_user.username,
        display_name=current_user.display_name,
        question=q.question,
        upvotes=q.upvotes,
        ai_answer=q.ai_answer,
        is_answered=q.is_answered,
        created_at=q.created_at,
    )


@router.post("/{stream_id}/questions/{question_id}/upvote", status_code=status.HTTP_204_NO_CONTENT)
async def upvote_question(
    stream_id: str,
    question_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(WhyQuestion).where(WhyQuestion.id == question_id, WhyQuestion.stream_id == stream_id)
    )
    q = result.scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    q.upvotes += 1
    await db.commit()
