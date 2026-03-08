"""SwanyThree AI Routes — LLM, moderation, transcription."""

import logging
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
import httpx

from api.config import settings
from api.database import get_db
from api.middleware.auth import get_current_user
from models.entities import User
from services.ai_wrapper import ai_wrapper

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/ai", tags=["AI"])


class ModerateRequest(BaseModel):
    message: str
    context: str = ""


class ChatRequest(BaseModel):
    messages: list[dict]
    task: str = "chat_response"
    compress: bool = True


@router.get("/health")
async def ai_health():
    """Check AI service availability."""
    status_results = {}
    async with httpx.AsyncClient(timeout=5.0) as client:
        # Ollama
        try:
            r = await client.get(f"{settings.OLLAMA_URL}/api/tags")
            status_results["ollama"] = r.status_code == 200
        except Exception:
            status_results["ollama"] = False
        # Whisper
        try:
            r = await client.get(f"{settings.WHISPER_URL}/health")
            status_results["whisper"] = r.status_code == 200
        except Exception:
            status_results["whisper"] = False
        # LLMLingua
        try:
            r = await client.get(f"{settings.LLMLINGUA_ENDPOINT}/health")
            status_results["llmlingua"] = r.status_code == 200
        except Exception:
            status_results["llmlingua"] = False
        # OpenRouter
        status_results["openrouter"] = bool(settings.OPENROUTER_API_KEY)

    return {"success": True, "services": status_results}


@router.post("/moderate")
async def moderate_message(req: ModerateRequest, current_user: User = Depends(get_current_user)):
    """Moderate a chat message for safety."""
    result = await ai_wrapper.moderate(req.message, req.context)
    return {"success": True, **result}


@router.post("/chat")
async def ai_chat(req: ChatRequest, current_user: User = Depends(get_current_user)):
    """Chat with the AI pipeline."""
    result = await ai_wrapper.smart_chat(req.messages, task=req.task, compress=req.compress)
    return {
        "success": True,
        "content": result.content,
        "model": result.model,
        "tokens_used": result.tokens_used,
        "compressed": result.compressed,
        "latency_ms": result.latency_ms,
    }


@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Transcribe audio via Faster-Whisper."""
    if not file.content_type or not file.content_type.startswith("audio"):
        raise HTTPException(status_code=400, detail="File must be audio")

    try:
        content = await file.read()
        async with httpx.AsyncClient(timeout=120.0) as client:
            r = await client.post(
                f"{settings.WHISPER_URL}/v1/audio/transcriptions",
                files={"file": (file.filename, content, file.content_type)},
                data={"model": "base", "language": "en"},
            )
            if r.status_code == 200:
                return {"success": True, **r.json()}
            raise HTTPException(status_code=502, detail="Transcription service error")
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Transcription timed out")


@router.get("/models")
async def list_models():
    """List available Ollama models."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(f"{settings.OLLAMA_URL}/api/tags")
            if r.status_code == 200:
                data = r.json()
                return {"success": True, "models": data.get("models", [])}
    except Exception:
        pass
    return {"success": True, "models": []}
