from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from api.database import get_db
from api.middleware.auth import get_current_user
from services.nft import nft_service
from services.ai import ai_service
from models.entities import User, NFT

router = APIRouter()

class MintHighlightRequest(BaseModel):
    video_url: str
    title: str
    description: str | None = None
    stream_id: str | None = None

@router.post("/mint-highlight")
async def mint_highlight(
    request: MintHighlightRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mint a stream highlight as an NFT."""
    # We could use AI to generate a better description or metadata here
    enhanced_desc = await ai_service.generate_chat_response(
        f"Generate a catchy NFT description for this stream highlight: {request.title}. Context: {request.description or ''}"
    )
    
    metadata = {
        "title": request.title,
        "description": enhanced_desc or request.description,
        "email": current_user.email,
        "attributes": [
            {"trait_type": "Creator", "value": current_user.username},
            {"trait_type": "Platform", "value": "SwanyThree"}
        ]
    }
    
    nft_result = await nft_service.mint_highlight(
        user_id=current_user.id,
        video_url=request.video_url,
        metadata=metadata
    )
    
    if not nft_result:
        raise HTTPException(status_code=500, detail="Failed to mint NFT")
        
    # Persist in DB
    new_nft = NFT(
        user_id=current_user.id,
        stream_id=request.stream_id,
        title=request.title,
        description=enhanced_desc or request.description,
        video_url=request.video_url,
        mint_hash=nft_result.get("mint_hash"),
        token_id=nft_result.get("token_id"),
        contract_address=nft_result.get("contract_address"),
        blockchain=nft_result.get("blockchain", "polygon")
    )
    db.add(new_nft)
    await db.commit()
    await db.refresh(new_nft)
    
    return {
        "nft_id": str(new_nft.id),
        "mint_details": nft_result
    }
