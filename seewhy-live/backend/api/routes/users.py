from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from ...core.database import get_db
from ...core.deps import get_current_user
from ...models.entities import User, Follow
from ..schemas import UserOut, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


async def _get_user_or_404(identifier: str, db: AsyncSession) -> User:
    """Look up by username or id."""
    result = await db.execute(
        select(User).where((User.username == identifier) | (User.id == identifier))
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)


@router.patch("/me", response_model=UserOut)
async def update_me(
    body: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.display_name is not None:
        current_user.display_name = body.display_name
    if body.bio is not None:
        current_user.bio = body.bio
    await db.commit()
    await db.refresh(current_user)
    return UserOut.model_validate(current_user)


@router.get("/top", response_model=list[UserOut])
async def top_creators(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User)
        .where(User.role.in_(["creator", "admin"]))
        .order_by(User.follower_count.desc())
        .limit(20)
    )
    return [UserOut.model_validate(u) for u in result.scalars().all()]


@router.get("/{identifier}", response_model=UserOut)
async def get_user(identifier: str, db: AsyncSession = Depends(get_db)):
    user = await _get_user_or_404(identifier, db)
    return UserOut.model_validate(user)


@router.post("/{user_id}/follow", status_code=status.HTTP_204_NO_CONTENT)
async def follow_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")

    target = await _get_user_or_404(user_id, db)

    existing = await db.execute(
        select(Follow).where(Follow.follower_id == current_user.id, Follow.following_id == target.id)
    )
    if existing.scalar_one_or_none():
        return  # already following

    db.add(Follow(follower_id=current_user.id, following_id=target.id))
    target.follower_count += 1
    current_user.following_count += 1
    await db.commit()


@router.delete("/{user_id}/follow", status_code=status.HTTP_204_NO_CONTENT)
async def unfollow_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    target = await _get_user_or_404(user_id, db)

    result = await db.execute(
        select(Follow).where(Follow.follower_id == current_user.id, Follow.following_id == target.id)
    )
    follow = result.scalar_one_or_none()
    if not follow:
        return

    await db.delete(follow)
    target.follower_count = max(0, target.follower_count - 1)
    current_user.following_count = max(0, current_user.following_count - 1)
    await db.commit()


@router.get("/{user_id}/followers", response_model=list[UserOut])
async def get_followers(user_id: str, db: AsyncSession = Depends(get_db)):
    user = await _get_user_or_404(user_id, db)
    result = await db.execute(
        select(User)
        .join(Follow, Follow.follower_id == User.id)
        .where(Follow.following_id == user.id)
        .limit(100)
    )
    return [UserOut.model_validate(u) for u in result.scalars().all()]


@router.get("/{user_id}/following", response_model=list[UserOut])
async def get_following(user_id: str, db: AsyncSession = Depends(get_db)):
    user = await _get_user_or_404(user_id, db)
    result = await db.execute(
        select(User)
        .join(Follow, Follow.following_id == User.id)
        .where(Follow.follower_id == user.id)
        .limit(100)
    )
    return [UserOut.model_validate(u) for u in result.scalars().all()]
