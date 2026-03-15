// ─────────────────────────────────────────────────────────────────────────────
// CY Live — Watch Party Routes
// ─────────────────────────────────────────────────────────────────────────────

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/error.js';
import crypto from 'crypto';

const router = Router();

const createWatchPartySchema = z.object({
  name: z.string().min(1).max(100),
  stageId: z.string().uuid(),
  maxSize: z.number().int().min(2).max(50).optional(),
});

// Create watch party
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const data = createWatchPartySchema.parse(req.body);

  // Verify stage exists and is live or upcoming
  const stage = await prisma.stage.findUnique({ where: { id: data.stageId } });
  if (!stage) throw new AppError(404, 'Stage not found');

  const code = crypto.randomBytes(4).toString('hex').toUpperCase();

  const party = await prisma.watchParty.create({
    data: {
      name: data.name,
      code,
      stageId: data.stageId,
      maxSize: data.maxSize ?? 10,
    },
  });

  // Auto-join creator
  await prisma.watchPartyMember.create({
    data: { watchPartyId: party.id, userId: req.user!.sub },
  });

  res.status(201).json(party);
});

// Join watch party by code
router.post('/join/:code', requireAuth, async (req: Request, res: Response) => {
  const party = await prisma.watchParty.findUnique({
    where: { code: (req.params.code as string).toUpperCase() },
    include: { _count: { select: { members: true } } },
  });

  if (!party || !party.isActive) throw new AppError(404, 'Watch party not found');
  if (party._count.members >= party.maxSize) {
    throw new AppError(400, 'Watch party is full');
  }

  // Check if already a member
  const existing = await prisma.watchPartyMember.findUnique({
    where: {
      watchPartyId_userId: { watchPartyId: party.id, userId: req.user!.sub },
    },
  });
  if (existing) {
    res.json({ message: 'Already in party', party });
    return;
  }

  await prisma.watchPartyMember.create({
    data: { watchPartyId: party.id, userId: req.user!.sub },
  });

  res.json(party);
});

// Leave watch party
router.post('/:id/leave', requireAuth, async (req: Request, res: Response) => {
  await prisma.watchPartyMember.deleteMany({
    where: { watchPartyId: req.params.id as string, userId: req.user!.sub },
  });
  res.json({ success: true });
});

// Get watch party details
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  const party = await prisma.watchParty.findUnique({
    where: { id: req.params.id as string },
    include: {
      members: {
        include: {
          user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        },
      },
      stage: {
        select: { id: true, title: true, status: true },
      },
    },
  });

  if (!party) throw new AppError(404, 'Watch party not found');
  res.json(party);
});

// End watch party
router.post('/:id/end', requireAuth, async (req: Request, res: Response) => {
  await prisma.watchParty.update({
    where: { id: req.params.id as string },
    data: { isActive: false },
  });
  res.json({ success: true });
});

export default router;
