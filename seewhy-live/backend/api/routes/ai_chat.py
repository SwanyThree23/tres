from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

from ..services.ai import ai_service

router = APIRouter(prefix="/ai", tags=["ai"])


class ChatMessage(BaseModel):
    role: str
    content: str


class JoyceRequest(BaseModel):
    messages: List[ChatMessage]
    system: str = ""


@router.post("/joyce")
async def joyce_chat(req: JoyceRequest):
    """Joyce AI chat endpoint — proxies to Claude with platform context."""
    try:
        import anthropic

        client = anthropic.AsyncAnthropic()
        response = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=512,
            system=req.system or "You are Joyce AI, the SeeWhy LIVE platform assistant.",
            messages=[{"role": m.role, "content": m.content} for m in req.messages],
        )
        return {"content": response.content[0].text}
    except Exception:
        return {"content": sandbox_response(req.messages[-1].content if req.messages else "")}


def sandbox_response(question: str) -> str:
    q = question.lower()
    if "washington" in q or "classic" in q:
        return "The Washington Classic 2026 is SeeWhy LIVE's premier domino tournament — Double Elimination, 7-Rock rules, 5/150 scoring, held at Jamar's Sports Bar in Des Moines, WA."
    if "7-rock" in q or "domino" in q or "rules" in q:
        return "7-Rock: draw 7 tiles, score multiples of 5 on open ends, first to 150 wins the hand. Double Elimination — two losses and you're out."
    if "90" in q or "split" in q or "revenue" in q:
        return "Creators keep 90% of every tip. SeeWhy LIVE's 10% platform fee is automatically handled by Stripe Connect — no manual splits required."
    if "pk" in q or "battle" in q:
        return "PK Battles are live 1v1 creator showdowns. Viewers send virtual gifts to power up their favorite fighter. Most gift-power at time's up wins."
    if "stream" in q or "rtmp" in q or "obs" in q:
        return "Set your OBS RTMP server to rtmp://stream.seewhylive.online/live (port 1935) and paste your encrypted stream key from your Studio page."
    return "I'm Joyce AI, SeeWhy LIVE's platform assistant. Ask me about the Washington Classic 2026, streaming setup, PK Battles, or creator tools!"
