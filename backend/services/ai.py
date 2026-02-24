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
                        "X-Provider": "SwanyThree",
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

    async def moderate_content(self, text: str) -> Dict[str, Any]:
        """Check if content is toxic or violative."""
        prompt = f"Analyze this chat message for toxicity, spam, or community violations. Message: '{text}'. Return JSON ONLY: {{'is_flagged': bool, 'reason': string, 'confidence': float}}"
        res = await self.generate_chat_response(prompt)
        if not res: return {"is_flagged": False, "reason": "No response"}
        
        try:
            import json
            import re
            match = re.search(r'\{.*\}', res, re.DOTALL)
            if match:
                return json.loads(match.group())
            return {"is_flagged": "flagged" in res.lower(), "reason": "Text analysis"}
        except:
            return {"is_flagged": "flagged" in res.lower(), "reason": "Text analysis"}

    async def suggest_director_scenes(self, context: str) -> List[Dict[str, str]]:
        """Suggest scene changes for a stream based on chat/meta context."""
        prompt = f"You are an AI Stream Director. Based on this context: '{context}', suggest 3 variations of stream scenes. Return JSON list ONLY: [{{'title': str, 'description': str}}]"
        res = await self.generate_chat_response(prompt)
        if not res: return []
        
        try:
            import json
            import re
            match = re.search(r'\[.*\]', res, re.DOTALL)
            if match:
                return json.loads(match.group())
            return []
        except:
            return [{"title": "Dynamic Reaction", "description": "Auto-switch to face-cam for high-action moment."}]

ai_service = AIService()
