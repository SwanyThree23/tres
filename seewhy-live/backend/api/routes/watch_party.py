import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from ...core.database import get_db
from ...core.deps import get_current_user
from ...models.entities import User, Stream

router = APIRouter(prefix="/watch-parties", tags=["watch-party"])

# In-memory party store — swap for Redis in production
_parties: dict[str, dict] = {}


def _new_party(stream_id: str, host_id: str, host_name: str) -> dict:
    return {
        "id": str(uuid.uuid4()),
        "stream_id": stream_id,
        "host_id": host_id,
        "members": [{"user_id": host_id, "display_name": host_name, "role": "host", "status": "watching"}],
        "position": 0.0,
        "playing": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }


class SyncPayload(BaseModel):
    position: float
    playing: bool


class PartyOut(BaseModel):
    id: str
    stream_id: str
    host_id: str
    members: list[dict]
    position: float
    playing: bool
    created_at: str


@router.post("/streams/{stream_id}/watch-party", response_model=PartyOut, status_code=status.HTTP_201_CREATED)
async def create_party(
    stream_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Stream).where(Stream.id == stream_id))
    stream = result.scalar_one_or_none()
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")

    party = _new_party(stream_id, current_user.id, current_user.display_name)
    _parties[party["id"]] = party
    return PartyOut(**party)


@router.get("/{party_id}", response_model=PartyOut)
async def get_party(party_id: str, _: User = Depends(get_current_user)):
    party = _parties.get(party_id)
    if not party:
        raise HTTPException(status_code=404, detail="Party not found")
    return PartyOut(**party)


@router.post("/{party_id}/join", response_model=PartyOut)
async def join_party(party_id: str, current_user: User = Depends(get_current_user)):
    party = _parties.get(party_id)
    if not party:
        raise HTTPException(status_code=404, detail="Party not found")

    MAX_MEMBERS = 20
    if len(party["members"]) >= MAX_MEMBERS:
        raise HTTPException(status_code=400, detail=f"Party is full ({MAX_MEMBERS} max)")

    already = any(m["user_id"] == current_user.id for m in party["members"])
    if not already:
        party["members"].append({
            "user_id": current_user.id,
            "display_name": current_user.display_name,
            "role": "guest",
            "status": "watching",
        })
    return PartyOut(**party)


@router.post("/{party_id}/leave", status_code=status.HTTP_204_NO_CONTENT)
async def leave_party(party_id: str, current_user: User = Depends(get_current_user)):
    party = _parties.get(party_id)
    if not party:
        return
    party["members"] = [m for m in party["members"] if m["user_id"] != current_user.id]
    if not party["members"]:
        _parties.pop(party_id, None)


@router.post("/{party_id}/sync", response_model=PartyOut)
async def sync_party(
    party_id: str,
    body: SyncPayload,
    current_user: User = Depends(get_current_user),
):
    party = _parties.get(party_id)
    if not party:
        raise HTTPException(status_code=404, detail="Party not found")
    if party["host_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Only the host can sync playback")
    party["position"] = body.position
    party["playing"] = body.playing
    return PartyOut(**party)
