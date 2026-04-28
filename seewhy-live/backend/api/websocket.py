"""
Socket.IO event handlers for real-time chat, why-board, and viewer tracking.
"""
import socketio
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from .services.ai import answer_why_question, moderate_message
from ..core.security import decode_token
from ..core.database import AsyncSessionLocal
from ..models.entities import User, Stream, WhyQuestion, ChatMessage

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
    logger=False,
    engineio_logger=False,
)

# In-memory viewer counts {stream_id: set of sid}
_viewers: dict[str, set[str]] = {}
# sid -> user mapping {sid: user_id}
_sid_user: dict[str, str | None] = {}
# sid -> stream {sid: stream_id}
_sid_stream: dict[str, str] = {}


async def _auth_user(sid: str, token: str | None) -> User | None:
    if not token:
        return None
    try:
        payload = decode_token(token)
        user_id = payload["sub"]
    except (ValueError, KeyError):
        return None
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()


@sio.event
async def connect(sid: str, environ: dict, auth: dict | None = None):
    token = (auth or {}).get("token")
    user = await _auth_user(sid, token)
    _sid_user[sid] = user.id if user else None


@sio.event
async def disconnect(sid: str):
    stream_id = _sid_stream.pop(sid, None)
    _sid_user.pop(sid, None)
    if stream_id and stream_id in _viewers:
        _viewers[stream_id].discard(sid)
        count = len(_viewers[stream_id])
        await sio.emit("viewer_count", {"count": count}, room=stream_id)
        # Update DB viewer count
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Stream).where(Stream.id == stream_id))
            stream = result.scalar_one_or_none()
            if stream:
                stream.viewer_count = count
                await db.commit()


@sio.event
async def join_stream(sid: str, data: dict):
    stream_id = data.get("stream_id", "")
    if not stream_id:
        return

    await sio.enter_room(sid, stream_id)
    _sid_stream[sid] = stream_id
    _viewers.setdefault(stream_id, set()).add(sid)

    count = len(_viewers[stream_id])
    await sio.emit("viewer_count", {"count": count}, room=stream_id)

    # Update DB
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Stream).where(Stream.id == stream_id))
        stream = result.scalar_one_or_none()
        if stream:
            stream.viewer_count = count
            if count > stream.peak_viewer_count:
                stream.peak_viewer_count = count
            await db.commit()


@sio.event
async def leave_stream(sid: str, data: dict):
    stream_id = data.get("stream_id", "")
    await sio.leave_room(sid, stream_id)
    if stream_id in _viewers:
        _viewers[stream_id].discard(sid)
        count = len(_viewers[stream_id])
        await sio.emit("viewer_count", {"count": count}, room=stream_id)


@sio.event
async def send_message(sid: str, data: dict):
    stream_id = data.get("stream_id", "")
    content = (data.get("content") or "").strip()
    user_id = _sid_user.get(sid)

    if not stream_id or not content or not user_id:
        return

    # Moderation
    is_safe, _ = await moderate_message(content)
    if not is_safe:
        await sio.emit("error", {"message": "Message blocked by moderation"}, to=sid)
        return

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            return

        msg = ChatMessage(
            stream_id=stream_id,
            user_id=user_id,
            content=content[:500],
            is_why_question=content.lower().startswith("why "),
        )
        db.add(msg)
        await db.commit()
        await db.refresh(msg)

        payload = {
            "id": msg.id,
            "user_id": user_id,
            "username": user.username,
            "display_name": user.display_name,
            "avatar_url": user.avatar_url,
            "content": content,
            "is_why_question": msg.is_why_question,
            "timestamp": msg.created_at.isoformat(),
        }

    await sio.emit("chat_message", payload, room=stream_id)


@sio.event
async def ask_why(sid: str, data: dict):
    stream_id = data.get("stream_id", "")
    question_text = (data.get("question") or "").strip()
    user_id = _sid_user.get(sid)

    if not stream_id or not question_text or not user_id:
        return

    async with AsyncSessionLocal() as db:
        user_result = await db.execute(select(User).where(User.id == user_id))
        user = user_result.scalar_one_or_none()
        stream_result = await db.execute(select(Stream).where(Stream.id == stream_id))
        stream = stream_result.scalar_one_or_none()
        if not user or not stream:
            return

        q = WhyQuestion(stream_id=stream_id, user_id=user_id, question=question_text[:300])
        db.add(q)
        await db.commit()
        await db.refresh(q)

        payload = {
            "id": q.id,
            "stream_id": stream_id,
            "user_id": user_id,
            "username": user.username,
            "display_name": user.display_name,
            "question": question_text,
            "upvotes": 0,
            "ai_answer": None,
            "is_answered": False,
            "created_at": q.created_at.isoformat(),
        }

    # Broadcast question immediately
    await sio.emit("why_question", payload, room=stream_id)

    # Generate AI answer asynchronously
    ai_answer = await answer_why_question(
        question_text,
        stream_context=f"Stream: {stream.title}, Category: {stream.category}" if stream else "",
    )

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(WhyQuestion).where(WhyQuestion.id == q.id))
        saved_q = result.scalar_one_or_none()
        if saved_q:
            saved_q.ai_answer = ai_answer
            saved_q.is_answered = True
            await db.commit()

    payload["ai_answer"] = ai_answer
    payload["is_answered"] = True
    await sio.emit("question_updated", payload, room=stream_id)


@sio.event
async def upvote_question(sid: str, data: dict):
    stream_id = data.get("stream_id", "")
    question_id = data.get("question_id", "")
    user_id = _sid_user.get(sid)

    if not question_id or not user_id:
        return

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(WhyQuestion)
            .options(selectinload(WhyQuestion.author))
            .where(WhyQuestion.id == question_id)
        )
        q = result.scalar_one_or_none()
        if not q:
            return
        q.upvotes += 1
        await db.commit()

        payload = {
            "id": q.id,
            "stream_id": q.stream_id,
            "user_id": q.user_id,
            "username": q.author.username,
            "display_name": q.author.display_name,
            "question": q.question,
            "upvotes": q.upvotes,
            "ai_answer": q.ai_answer,
            "is_answered": q.is_answered,
            "created_at": q.created_at.isoformat(),
        }

    await sio.emit("question_updated", payload, room=stream_id)
