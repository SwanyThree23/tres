// ─────────────────────────────────────────────────────────────────────────────
// CY Live — Aura AI Service  |  Anthropic Claude Sonnet  |  SSE Streaming
// ─────────────────────────────────────────────────────────────────────────────

import Anthropic from '@anthropic-ai/sdk';
import logger from '../lib/logger.js';

const MODEL = 'claude-sonnet-4-20250514';

let anthropic: Anthropic | null = null;

function getClient(): Anthropic {
  if (!anthropic) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is required for Aura AI');
    }
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropic;
}

export interface AuraMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Non-streaming Aura response
 */
export async function chat(
  messages: AuraMessage[],
  systemPrompt?: string,
) {
  const client = getClient();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: systemPrompt ?? getDefaultSystemPrompt(),
    messages,
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  return {
    content: textBlock?.text ?? '',
    usage: response.usage,
    stopReason: response.stop_reason,
  };
}

/**
 * SSE-streaming Aura response — yields text deltas
 */
export async function* chatStream(
  messages: AuraMessage[],
  systemPrompt?: string,
): AsyncGenerator<string> {
  const client = getClient();

  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 2048,
    system: systemPrompt ?? getDefaultSystemPrompt(),
    messages,
  });

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      yield event.delta.text;
    }
  }
}

/**
 * Content moderation check
 */
export async function moderateContent(content: string): Promise<{
  safe: boolean;
  reason?: string;
}> {
  const client = getClient();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 256,
    system:
      'You are a content moderator. Analyze the following content and respond with JSON: {"safe": true/false, "reason": "reason if unsafe"}. Be strict about hate speech, harassment, explicit content, and spam.',
    messages: [{ role: 'user', content }],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  try {
    return JSON.parse(textBlock?.text ?? '{"safe": true}');
  } catch {
    logger.warn('Failed to parse moderation response');
    return { safe: true };
  }
}

function getDefaultSystemPrompt() {
  return `You are Aura, the AI assistant for CY Live — a live streaming and creator monetization platform. You are helpful, concise, and knowledgenable about live streaming, content creation, and digital commerce. Keep responses under 500 words unless asked for more detail.`;
}
