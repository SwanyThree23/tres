// ─────────────────────────────────────────────────────────────────────────────
// CY Live — Stages Routes
// ─────────────────────────────────────────────────────────────────────────────

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/error.js';
import { StageStatus } from '@prisma/client';

const router = Router();

// ── Schemas ──────────────────────────────────────────────────────────────────

const createStageSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  thumbnailUrl: z.string().url().optional(),
  scheduledAt: z.string().datetime().optional(),
  isPrivate: z.boolean().optional(),
});

const updateStageSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  thumbnailUrl: z.string().url().optional(),
  scheduledAt: z.string().datetime().optional(),
  isPrivate: z.boolean().optional(),
  status: z.enum(['UPCOMING', 'LIVE', 'ENDED']).optional(),
});

// ── Routes ──────────────────────────────────────────────────────────────────

// List stages (public)
router.get('/', optionalAuth, async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
  const status = req.query.status as string | undefined;

  const where: any = { isPrivate: false };
  if (status && ['UPCOMING', 'LIVE', 'ENDED'].includes(status)) {
    where.status = status;
  }

  const [stages, total] = await Promise.all([
    prisma.stage.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ status: 'asc' }, { scheduledAt: 'asc' }, { createdAt: 'desc' }],
      include: {
        creator: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        _count: { select: { guests: true, chatMessages: true } },
      },
    }),
    prisma.stage.count({ where }),
  ]);

  res.json({ stages, total, page, limit, pages: Math.ceil(total / limit) });
});

// Get single stage
router.get('/:id', optionalAuth, async (req: Request, res: Response) => {
  const stage = await prisma.stage.findUnique({
    where: { id: req.params.id as string },
    include: {
      creator: {
        select: { id: true, username: true, displayName: true, avatarUrl: true },
      },
      guests: {
        include: {
          user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        },
      },
      _count: { select: { chatMessages: true, transactions: true } },
    },
  });

  if (!stage) throw new AppError(404, 'Stage not found');
  if (stage.isPrivate && stage.creatorId !== req.user?.sub) {
    throw new AppError(403, 'This stage is private');
  }

  res.json(stage);
});

// Create stage (creator+ only)
router.post('/', requireAuth, requireRole('CREATOR', 'ADMIN'), async (req: Request, res: Response) => {
  const data = createStageSchema.parse(req.body);

  const stage = await prisma.stage.create({
    data: {
      ...data,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      creatorId: req.user!.sub,
    },
    include: {
      creator: {
        select: { id: true, username: true, displayName: true },
      },
    },
  });

  res.status(201).json(stage);
});

// Update stage
router.patch('/:id', requireAuth, async (req: Request, res: Response) => {
  const stage = await prisma.stage.findUnique({ where: { id: req.params.id as string } });
  if (!stage) throw new AppError(404, 'Stage not found');
  if (stage.creatorId !== req.user!.sub && req.user!.role !== 'ADMIN') {
    throw new AppError(403, 'Not authorized');
  }

  const data = updateStageSchema.parse(req.body);

  // Handle status transitions
  const updateData: any = { ...data };
  if (data.scheduledAt) updateData.scheduledAt = new Date(data.scheduledAt);
  if (data.status === 'LIVE' && stage.status === 'UPCOMING') {
    updateData.startedAt = new Date();
  }
  if (data.status === 'ENDED') {
    updateData.endedAt = new Date();
  }

  const updated = await prisma.stage.update({
    where: { id: req.params.id as string },
    data: updateData,
    include: {
      creator: {
        select: { id: true, username: true, displayName: true },
      },
    },
  });

  res.json(updated);
});

// Delete stage
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const stage = await prisma.stage.findUnique({ where: { id: req.params.id as string } });
  if (!stage) throw new AppError(404, 'Stage not found');
  if (stage.creatorId !== req.user!.sub && req.user!.role !== 'ADMIN') {
    throw new AppError(403, 'Not authorized');
  }

  await prisma.stage.delete({ where: { id: req.params.id as string } });
  res.json({ success: true });
});

// Go live
router.post('/:id/go-live', requireAuth, async (req: Request, res: Response) => {
  const stage = await prisma.stage.findUnique({ where: { id: req.params.id as string } });
  if (!stage) throw new AppError(404, 'Stage not found');
  if (stage.creatorId !== req.user!.sub) throw new AppError(403, 'Not authorized');
  if (stage.status === 'LIVE') throw new AppError(400, 'Stage is already live');

  const updated = await prisma.stage.update({
    where: { id: req.params.id as string },
    data: { status: StageStatus.LIVE, startedAt: new Date() },
  });

  res.json(updated);
});

// End stage
router.post('/:id/end', requireAuth, async (req: Request, res: Response) => {
  const stage = await prisma.stage.findUnique({ where: { id: req.params.id as string } });
  if (!stage) throw new AppError(404, 'Stage not found');
  if (stage.creatorId !== req.user!.sub) throw new AppError(403, 'Not authorized');

  const updated = await prisma.stage.update({
    where: { id: req.params.id as string },
    data: { status: StageStatus.ENDED, endedAt: new Date() },
  });

  res.json(updated);
});

// My stages (creator)
router.get('/my/stages', requireAuth, async (req: Request, res: Response) => {
  const stages = await prisma.stage.findMany({
    where: { creatorId: req.user!.sub },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { guests: true, chatMessages: true, transactions: true } },
    },
  });

  res.json(stages);
});

export default router;
