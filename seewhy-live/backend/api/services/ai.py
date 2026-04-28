import anthropic
from ...core.config import get_settings

settings = get_settings()

_client: anthropic.AsyncAnthropic | None = None


def _get_client() -> anthropic.AsyncAnthropic:
    global _client
    if _client is None:
        _client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _client


SYSTEM_PROMPT = """\
You are the SeeWhy LIVE AI co-host — a concise, knowledgeable assistant that helps explain \
WHY things work the way they do. When answering a viewer's "why" question:
- Give a clear, direct answer in 2-4 sentences
- Use an analogy when it helps
- Stay curious and encouraging
- Never make up facts; if unsure, say so
Respond in plain text only, no markdown."""


async def answer_why_question(question: str, stream_context: str = "") -> str:
    """Generate an AI answer for a viewer's why question."""
    if not settings.anthropic_api_key:
        return "AI answers are not configured for this deployment."

    try:
        client = _get_client()
        user_message = question
        if stream_context:
            user_message = f"[Stream context: {stream_context}]\n\nViewer question: {question}"

        message = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=256,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )
        return message.content[0].text if message.content else "Unable to generate an answer."
    except Exception:
        return "AI is temporarily unavailable. The creator will answer this live!"


async def moderate_message(content: str) -> tuple[bool, str]:
    """Return (is_safe, reason). Lightweight moderation check."""
    if not settings.anthropic_api_key:
        return True, ""

    BLOCKLIST = ["spam", "buy now", "click here", "free money"]
    lower = content.lower()
    if any(word in lower for word in BLOCKLIST):
        return False, "Potential spam detected"

    return True, ""
