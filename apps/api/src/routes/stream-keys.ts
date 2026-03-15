// ─────────────────────────────────────────────────────────────────────────────
// CY Live — Stream Keys Routes
// ─────────────────────────────────────────────────────────────────────────────

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as videoService from '../services/video.js';
import { AppError } from '../middleware/error.js';
import prisma from '../lib/prisma.js';

const router = Router();

const createKeySchema = z.object({
  stageId: z.string().uuid(),
  platform: z.enum(['YOUTUBE', 'TWITCH', 'TIKTOK', 'FACEBOOK', 'CUSTOM', 'OBS', 'WHIP']),
});

// Generate stream key
router.post('/', requireAuth, requireRole('CREATOR', 'ADMIN'), async (req: Request, res: Response) => {
  const data = createKeySchema.parse(req.body);

  // Verify ownership
  const stage = await prisma.stage.findUnique({ where: { id: data.stageId } });
  if (!stage || stage.creatorId !== req.user!.sub) {
    throw new AppError(403, 'Not authorized');
  }

  const key = await videoService.generateStreamKey(data.stageId, req.user!.sub, data.platform);
  res.status(201).json(key);
});

// List my stream keys for a stage
router.get('/stage/:stageId', requireAuth, async (req: Request, res: Response) => {
  const keys = await videoService.getStageStreamKeys(req.params.stageId, req.user!.sub);
  res.json(keys);
});

// Revoke a stream key
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    await videoService.revokeStreamKey(req.params.id, req.user!.sub);
    res.json({ success: true });
  } catch {
    throw new AppError(404, 'Stream key not found');
  }
});

// Get stream status
router.get('/:id/status', requireAuth, async (req: Request, res: Response) => {
  const streamKey = await prisma.streamKey.findUnique({ where: { id: req.params.id } });
  if (!streamKey) throw new AppError(404, 'Stream key not found');

  const status = await videoService.getStreamStatus(streamKey.key);
  res.json(status);
});

export default router;
