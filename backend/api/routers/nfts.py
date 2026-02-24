from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from api.database import get_db
from api.middleware.auth import get_current_user
from models.entities import User, NFT
from pydantic import BaseModel

router = APIRouter()

class NFTRead(BaseModel):
    id: str
    title: str
    description: str | None
    video_url: str
    mint_hash: str | None
    token_id: str | None
    contract_address: str | None
    blockchain: str
    created_at: str

    class Config:
        from_attributes = True

@router.get("/", response_model=List[dict])
async def list_my_nfts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all highlights minted by the current user."""
    result = await db.execute(select(NFT).where(NFT.user_id == current_user.id))
    nfts = result.scalars().all()
    
    return [
        {
            "id": str(n.id),
            "title": n.title,
            "description": n.description,
            "video_url": n.video_url,
            "mint_hash": n.mint_hash,
            "token_id": n.token_id,
            "contract_address": n.contract_address,
            "blockchain": n.blockchain,
            "created_at": n.created_at.isoformat() if n.created_at else None
        }
        for n in nfts
    ]
