// ─────────────────────────────────────────────────────────────────────────────
// CY Live — Aura AI Routes  |  Claude Sonnet · SSE Streaming
// ─────────────────────────────────────────────────────────────────────────────

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rate-limit.js';
import * as auraService from '../services/aura.js';
import { AppError } from '../middleware/error.js';

const router = Router();

const auraLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  keyPrefix: 'rl:aura',
});

const chatSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().min(1).max(4000),
    }),
  ).min(1).max(50),
  stream: z.boolean().optional(),
  systemPrompt: z.string().max(2000).optional(),
});

// ── Chat (non-streaming) ────────────────────────────────────────────────────

router.post('/chat', requireAuth, auraLimiter, async (req: Request, res: Response) => {
  const data = chatSchema.parse(req.body);

  if (data.stream) {
    // SSE streaming response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    try {
      for await (const chunk of auraService.chatStream(data.messages, data.systemPrompt)) {
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (err) {
      res.write(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`);
      res.end();
    }
    return;
  }

  const result = await auraService.chat(data.messages, data.systemPrompt);
  res.json(result);
});

// ── Content Moderation ──────────────────────────────────────────────────────

router.post('/moderate', requireAuth, async (req: Request, res: Response) => {
  const { content } = req.body;
  if (!content) throw new AppError(400, 'Content required');

  const result = await auraService.moderateContent(content);
  res.json(result);
});

export default router;
