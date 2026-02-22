import httpx
import logging
from api.config import settings
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

class AIService:
    """Service to interact with local AI models (Ollama, Whisper) and external APIs."""

    def __init__(self):
        self.ollama_url = settings.OLLAMA_URL
        self.whisper_url = settings.WHISPER_URL
        self.openrouter_key = settings.OPENROUTER_API_KEY

    async def generate_chat_response(self, prompt: str, model: str = None) -> Optional[str]:
        """Generate a response using Ollama."""
        model = model or settings.DEFAULT_LLM_MODEL
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.ollama_url}/api/generate",
                    json={"model": model, "prompt": prompt, "stream": False}
                )
                response.raise_for_status()
                return response.json().get("response")
        except Exception as e:
            logger.error(f"Ollama generation failed: {e}")
            return None

    async def transcribe_audio(self, audio_content: bytes) -> Optional[str]:
        """Transcribe audio using Whisper service."""
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                files = {"file": ("audio.wav", audio_content, "audio/wav")}
                response = await client.post(f"{self.whisper_url}/transcribe", files=files)
                response.raise_for_status()
                return response.json().get("text")
        except Exception as e:
            logger.error(f"Whisper transcription failed: {e}")
            return None

    async def openrouter_complete(self, prompt: str, model: str = "google/gemini-pro-1.5") -> Optional[str]:
        """Fallback to OpenRouter for more complex tasks."""
        if not self.openrouter_key:
            return None
            
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.openrouter_key}",
                        "X-Title": "SwanyThree Platform"
                    },
                    json={
                        "model": model,
                        "messages": [{"role": "user", "content": prompt}]
                    }
                )
                response.raise_for_status()
                return response.json()["choices"][0]["message"]["content"]
        except Exception as e:
            logger.error(f"OpenRouter completion failed: {e}")
            return None

ai_service = AIService()
