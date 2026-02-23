"""SwanyAI Wrapper Pro — Three-tier AI pipeline with automatic fallback.

Pipeline: LLMLingua (compression) → OpenRouter (multi-model) → Ollama (local fallback)
"""

import time
import json
import logging
from dataclasses import dataclass, field
from typing import Optional

import httpx

from api.config import settings

logger = logging.getLogger(__name__)


@dataclass
class AIResponse:
    """Response from the AI pipeline."""
    content: str
    model: str
    tokens_used: int = 0
    compressed: bool = False
    latency_ms: int = 0
    cost_saved_pct: float = 0.0


MODEL_ROUTING = {
    "moderation": "meta-llama/llama-3.3-70b-instruct",
    "chat_response": "anthropic/claude-sonnet-4-20250514",
    "summary": "anthropic/claude-sonnet-4-20250514",
    "creative": "anthropic/claude-sonnet-4-20250514",
    "code": "anthropic/claude-sonnet-4-20250514",
}


class SwanyAIWrapper:
    """Three-tier AI intelligence pipeline."""

    def __init__(self):
        self.openrouter_key = settings.OPENROUTER_API_KEY
        self.ollama_url = settings.OLLAMA_URL
        self.llmlingua_endpoint = settings.LLMLINGUA_ENDPOINT
        self.default_model = settings.DEFAULT_LLM_MODEL
        self.client = httpx.AsyncClient(timeout=60.0)

    async def compress_prompt(self, text: str, target_ratio: float = 0.5) -> tuple[str, float]:
        """Compress prompt via LLMLingua.

        Returns (compressed_text, compression_ratio). Falls back to truncation on failure.
        """
        try:
            response = await self.client.post(
                f"{self.llmlingua_endpoint}/compress",
                json={"context": text, "instruction": "", "target_token": int(len(text.split()) * target_ratio), "rate": target_ratio},
                timeout=15.0,
            )
            if response.status_code == 200:
                data = response.json()
                compressed = data.get("compressed_prompt", text)
                ratio = 1 - (len(compressed.split()) / max(len(text.split()), 1))
                logger.info(f"LLMLingua compression ratio: {ratio:.1%}")
                return compressed, ratio
        except Exception as e:
            logger.warning(f"LLMLingua compression failed, using truncation: {e}")

        # Fallback: simple truncation
        words = text.split()
        target_len = int(len(words) * target_ratio)
        truncated = " ".join(words[:target_len])
        return truncated, target_ratio

    async def call_openrouter(self, messages: list[dict], model: str, temperature: float = 0.7) -> Optional[AIResponse]:
        """Call OpenRouter multi-model API.

        Returns AIResponse on success, None on failure (triggers Ollama fallback).
        """
        if not self.openrouter_key:
            logger.warning("OpenRouter API key not configured, skipping")
            return None

        start = time.monotonic()
        try:
            response = await self.client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.openrouter_key}",
                    "HTTP-Referer": "https://swanythree.com",
                    "X-Title": "SwanyThree Platform",
                    "Content-Type": "application/json",
                },
                json={"model": model, "messages": messages, "temperature": temperature},
                timeout=30.0,
            )
            if response.status_code == 200:
                data = response.json()
                choice = data["choices"][0]["message"]["content"]
                tokens = data.get("usage", {}).get("total_tokens", 0)
                latency = int((time.monotonic() - start) * 1000)
                return AIResponse(content=choice, model=model, tokens_used=tokens, latency_ms=latency)
            else:
                logger.warning(f"OpenRouter returned {response.status_code}: {response.text[:200]}")
                return None
        except Exception as e:
            logger.warning(f"OpenRouter call failed: {e}")
            return None

    async def call_ollama(self, prompt: str, model: str | None = None) -> AIResponse:
        """Call Ollama local LLM as fallback ($0/month).

        This is the last resort — always returns a response.
        """
        model = model or self.default_model
        start = time.monotonic()
        try:
            response = await self.client.post(
                f"{self.ollama_url}/api/generate",
                json={"model": model, "prompt": prompt, "stream": False},
                timeout=120.0,
            )
            if response.status_code == 200:
                data = response.json()
                content = data.get("response", "")
                latency = int((time.monotonic() - start) * 1000)
                return AIResponse(content=content, model=f"ollama/{model}", latency_ms=latency)
        except Exception as e:
            logger.error(f"Ollama call failed: {e}")

        latency = int((time.monotonic() - start) * 1000)
        return AIResponse(
            content="I'm temporarily unable to process this request. Please try again.",
            model="fallback",
            latency_ms=latency,
        )

    async def smart_chat(self, messages: list[dict], task: str = "chat_response", compress: bool = True) -> AIResponse:
        """Full AI pipeline with auto-fallback.

        1. Optionally compress via LLMLingua
        2. Try OpenRouter with task-specific model
        3. Fall back to Ollama if OpenRouter fails
        """
        cost_saved = 0.0
        compressed = False

        # Step 1: Optional compression
        if compress and messages:
            last_content = messages[-1].get("content", "")
            if len(last_content.split()) > 100:
                compressed_text, ratio = await self.compress_prompt(last_content)
                messages = messages.copy()
                messages[-1] = {**messages[-1], "content": compressed_text}
                cost_saved = ratio * 100
                compressed = True

        # Step 2: Try OpenRouter
        model = MODEL_ROUTING.get(task, MODEL_ROUTING["chat_response"])
        result = await self.call_openrouter(messages, model)
        if result:
            result.compressed = compressed
            result.cost_saved_pct = cost_saved
            return result

        # Step 3: Fallback to Ollama
        prompt = "\n".join(f"{m.get('role', 'user')}: {m.get('content', '')}" for m in messages)
        result = await self.call_ollama(prompt)
        result.compressed = compressed
        result.cost_saved_pct = cost_saved
        return result

    async def moderate(self, message: str, context: str = "") -> dict:
        """Moderate a chat message for safety.

        Returns dict with: safe (bool), category (str), confidence (float), reason (str)
        """
        system_prompt = (
            "You are a content moderation system. Analyze the following message and respond with ONLY "
            "a JSON object containing: safe (boolean), category (one of: clean, toxic, spam, nsfw, "
            "harassment, hate_speech, self_harm, violence), confidence (0.0-1.0), reason (brief explanation). "
            "Be strict but fair. Gaming/streaming context is normal."
        )
        prompt_text = f"Context: {context}\nMessage to moderate: {message}" if context else f"Message to moderate: {message}"

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt_text},
        ]

        result = await self.smart_chat(messages, task="moderation", compress=False)

        try:
            parsed = json.loads(result.content)
            return {
                "safe": parsed.get("safe", True),
                "category": parsed.get("category", "clean"),
                "confidence": parsed.get("confidence", 0.5),
                "reason": parsed.get("reason", ""),
            }
        except (json.JSONDecodeError, KeyError):
            if any(word in result.content.lower() for word in ["unsafe", "toxic", "spam", "nsfw", "false"]):
                return {"safe": False, "category": "flagged", "confidence": 0.5, "reason": result.content[:200]}
            return {"safe": True, "category": "clean", "confidence": 0.5, "reason": "Could not parse moderation response"}

    async def summarize_stream(self, transcript: str, title: str) -> str:
        """Generate a 3-4 sentence stream summary."""
        messages = [
            {"role": "system", "content": "You are a stream summarizer. Write a concise 3-4 sentence summary of this stream."},
            {"role": "user", "content": f"Stream title: {title}\n\nTranscript:\n{transcript}"},
        ]
        result = await self.smart_chat(messages, task="summary")
        return result.content

    async def generate_chat_response(self, history: list[dict], username: str) -> str:
        """Generate a SwanyBot co-host chat response."""
        system_msg = (
            "You are SwanyBot, the AI co-host on SwanyThree streaming platform. "
            "You're friendly, engaging, and knowledgeable about streaming. "
            "Keep responses under 200 characters. Use casual streaming language. "
            "Be helpful and entertaining."
        )
        messages = [{"role": "system", "content": system_msg}] + history + [
            {"role": "user", "content": f"{username} is asking for your input."},
        ]
        result = await self.smart_chat(messages, task="chat_response", compress=False)
        return result.content[:500]

    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()


ai_wrapper = SwanyAIWrapper()
