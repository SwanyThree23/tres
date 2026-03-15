// ─────────────────────────────────────────────────────────────────────────────
// CY Live — VDO (Video) Routes  |  VDO.Ninja + MediaMTX
// ─────────────────────────────────────────────────────────────────────────────

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as videoService from '../services/video.js';
import { AppError } from '../middleware/error.js';

const router = Router();

// Get VDO.Ninja room config for a stage
router.get('/room/:stageId', requireAuth, async (req: Request, res: Response) => {
  const role = (req.query.role as string) ?? 'viewer';
  if (!['host', 'guest', 'viewer'].includes(role)) {
    throw new AppError(400, 'Invalid role');
  }

  const config = videoService.getVdoNinjaConfig(
    req.params.stageId as string,
    role as 'host' | 'guest' | 'viewer',
  );
  res.json(config);
});

// Get stream status
router.get('/status/:streamKey', requireAuth, async (req: Request, res: Response) => {
  const status = await videoService.getStreamStatus(req.params.streamKey as string);
  res.json(status);
});

export default router;
