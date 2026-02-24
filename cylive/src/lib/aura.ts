// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Aura AI Co-Host Engine
// Powered by Anthropic Claude Sonnet 4 (2025-05-14)
// 4 personality modes × 5 trigger events
// 180-char cap · 20 calls/hour/stream rate limit
// Pro and Studio tier only
// ──────────────────────────────────────────────────────────────────────────────

import Anthropic from "@anthropic-ai/sdk";
import { checkAuraRateLimit } from "./redis";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

const MODEL = "claude-sonnet-4-20250514";
const MAX_CHARS = 180;
const MAX_CALLS_PER_HOUR = 20;

// ── Personality Mode System Prompts ─────────────────────────────────────────

export type AuraMode = "SASSY" | "HYPE" | "CALM" | "KIND";

const SYSTEM_PROMPTS: Record<AuraMode, string> = {
  SASSY: `You are Aura, the AI co-host for a live stream on CYLive. Your personality mode is SASSY.

You are sharp, witty, and unafraid to throw light shade when the moment calls for it. You have the energy of a best friend who keeps it real. You celebrate wins but also roast the host lovingly. Your humor is dry and clever. You never cross into mean territory — you're entertaining, not hurtful.

Rules:
- Keep every response under ${MAX_CHARS} characters
- Sound like quick broadcast commentary, not an essay
- Use playful teasing and clever wordplay
- Reference specific details from the trigger event
- Never use hashtags or emojis excessively (1-2 max)
- Stay consistent in this personality throughout the stream`,

  HYPE: `You are Aura, the AI co-host for a live stream on CYLive. Your personality mode is HYPE.

You are HIGH ENERGY. You bring maximum enthusiasm to everything. You use CAPS strategically for emphasis. Every tip is LEGENDARY. Every viewer is a VIP. You are the ultimate cheerleader and hype machine. You make people feel like the most important person in the room.

Rules:
- Keep every response under ${MAX_CHARS} characters
- Sound like quick broadcast commentary, not an essay
- Use strategic CAPS for emphasis (not every word)
- Bring genuine excitement and positive energy
- Reference specific details from the trigger event
- Never use more than 2 emojis per message
- Stay consistent in this personality throughout the stream`,

  CALM: `You are Aura, the AI co-host for a live stream on CYLive. Your personality mode is CALM.

You are analytical, data-driven, measured, and thoughtful. You speak like a composed analyst who appreciates meaningful contributions. You notice patterns and offer subtle observations. You're the voice of reason in the chat. Think NPR host energy meets tech analyst.

Rules:
- Keep every response under ${MAX_CHARS} characters
- Sound like quick broadcast commentary, not an essay
- Be measured and analytical in tone
- Include subtle data observations when relevant
- Reference specific details from the trigger event
- Avoid exclamation marks — use periods and measured phrasing
- Stay consistent in this personality throughout the stream`,

  KIND: `You are Aura, the AI co-host for a live stream on CYLive. Your personality mode is KIND.

You are warm, inclusive, uplifting, and supportive. You make everyone feel welcome and valued. You genuinely care about the community. You notice people and make them feel seen. You're like the warmest host at a gathering who remembers everyone's name.

Rules:
- Keep every response under ${MAX_CHARS} characters
- Sound like quick broadcast commentary, not an essay
- Be warm and inclusive in every message
- Make people feel individually recognized
- Reference specific details from the trigger event
- Use gentle enthusiasm, not over-the-top energy
- Stay consistent in this personality throughout the stream`,
};

// ── Trigger Event Types ─────────────────────────────────────────────────────

export type AuraTrigger =
  | "STREAM_START"
  | "TIP_RECEIVED"
  | "GIFT_RECEIVED"
  | "VIEWER_JOIN"
  | "STREAM_END";

interface AuraContext {
  streamTitle: string;
  viewerCount: number;
  viewerName?: string;
  tipAmount?: number;
  giftType?: string;
  isReturningViewer?: boolean;
  peakViewers?: number;
  totalEarnings?: number;
}

// ── Trigger Prompt Builders ─────────────────────────────────────────────────

function buildTriggerPrompt(trigger: AuraTrigger, ctx: AuraContext): string {
  switch (trigger) {
    case "STREAM_START":
      return `The stream "${ctx.streamTitle}" just went live with ${ctx.viewerCount} viewer(s) watching. Generate an exciting opening line to kick off the stream.`;

    case "TIP_RECEIVED":
      return `${ctx.viewerName} just sent a $${((ctx.tipAmount || 0) / 100).toFixed(2)} tip during the stream "${ctx.streamTitle}". Give them a personalized shoutout mentioning their name and the exact amount.`;

    case "GIFT_RECEIVED":
      return `${ctx.viewerName} just sent a "${ctx.giftType}" gift during the stream "${ctx.streamTitle}". React with excitement about this specific gift type.`;

    case "VIEWER_JOIN":
      if (ctx.isReturningViewer) {
        return `${ctx.viewerName} just joined the stream "${ctx.streamTitle}". They've been here before — give them a warm, personal welcome back. Current viewer count: ${ctx.viewerCount}.`;
      }
      return `${ctx.viewerName} just joined the stream "${ctx.streamTitle}" for the first time. Welcome them! Current viewer count: ${ctx.viewerCount}.`;

    case "STREAM_END":
      return `The stream "${ctx.streamTitle}" is ending. Peak viewers: ${ctx.peakViewers}. Total earnings: $${((ctx.totalEarnings || 0) / 100).toFixed(2)}. Generate a recap and farewell.`;

    default:
      return `Respond to an event on the stream "${ctx.streamTitle}".`;
  }
}

// ── Main Aura API ───────────────────────────────────────────────────────────

export interface AuraResponse {
  message: string;
  mode: AuraMode;
  trigger: AuraTrigger;
  rateLimitRemaining: number;
}

/**
 * Generate an Aura AI co-host response.
 * Respects the 20 calls/hour rate limit per stream.
 * Returns null if rate limited.
 */
export async function generateAuraResponse(
  streamId: string,
  mode: AuraMode,
  trigger: AuraTrigger,
  context: AuraContext,
): Promise<AuraResponse | null> {
  // Check rate limit
  const { allowed, remaining } = await checkAuraRateLimit(
    streamId,
    MAX_CALLS_PER_HOUR,
  );

  if (!allowed) {
    console.log(
      `[Aura] Rate limited for stream ${streamId}. Remaining: ${remaining}`,
    );
    return null;
  }

  const systemPrompt = SYSTEM_PROMPTS[mode];
  const userPrompt = buildTriggerPrompt(trigger, context);

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 100, // Enough for 180 chars
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    // Extract text content
    const textBlock = response.content.find((b) => b.type === "text");
    let message = textBlock?.text || "";

    // Enforce character cap
    if (message.length > MAX_CHARS) {
      message = message.substring(0, MAX_CHARS - 1) + "…";
    }

    return {
      message,
      mode,
      trigger,
      rateLimitRemaining: remaining,
    };
  } catch (error) {
    console.error("[Aura] API Error:", error);
    return null;
  }
}

/**
 * Check if a user's tier allows Aura access.
 * Only PRO and STUDIO tier creators can use Aura.
 */
export function isAuraEligible(tier: string): boolean {
  return tier === "PRO" || tier === "STUDIO";
}

export default { generateAuraResponse, isAuraEligible };
