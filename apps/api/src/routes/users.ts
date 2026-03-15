// ─────────────────────────────────────────────────────────────────────────────
// CY Live — Users Routes
// ─────────────────────────────────────────────────────────────────────────────

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import * as authService from '../services/auth.js';
import * as emailService from '../services/email.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rate-limit.js';
import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/error.js';

const router = Router();

// ── Schemas ──────────────────────────────────────────────────────────────────

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/),
  displayName: z.string().max(50).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const updateProfileSchema = z.object({
  displayName: z.string().max(50).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
});

// ── Auth Routes ──────────────────────────────────────────────────────────────

router.post('/register', authLimiter, async (req: Request, res: Response) => {
  const data = registerSchema.parse(req.body);

  try {
    const result = await authService.register(data);

    // Send verification email (non-blocking)
    emailService.sendVerificationEmail(data.email, result.emailVerifyToken).catch(() => {});

    res.status(201).json({
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (err: any) {
    throw new AppError(409, err.message);
  }
});

router.post('/login', authLimiter, async (req: Request, res: Response) => {
  const data = loginSchema.parse(req.body);

  try {
    const result = await authService.login(data.email, data.password);
    res.json(result);
  } catch (err: any) {
    throw new AppError(401, err.message);
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new AppError(400, 'Refresh token required');

  try {
    const tokens = await authService.refreshTokens(refreshToken);
    res.json(tokens);
  } catch (err: any) {
    throw new AppError(401, err.message);
  }
});

router.post('/logout', requireAuth, async (req: Request, res: Response) => {
  await authService.logout(req.user!.sub);
  res.json({ success: true });
});

router.post('/verify-email', async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token) throw new AppError(400, 'Token required');

  try {
    await authService.verifyEmail(token);
    res.json({ success: true });
  } catch (err: any) {
    throw new AppError(400, err.message);
  }
});

router.post('/forgot-password', authLimiter, async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) throw new AppError(400, 'Email required');

  const result = await authService.requestPasswordReset(email);

  // Send email if token generated (non-blocking)
  if (result.token) {
    emailService.sendPasswordResetEmail(email, result.token).catch(() => {});
  }

  // Always return success to prevent email enumeration
  res.json({ success: true, message: 'If the email exists, a reset link has been sent.' });
});

router.post('/reset-password', authLimiter, async (req: Request, res: Response) => {
  const { token, password } = req.body;
  if (!token || !password) throw new AppError(400, 'Token and password required');

  try {
    await authService.resetPassword(token, password);
    res.json({ success: true });
  } catch (err: any) {
    throw new AppError(400, err.message);
  }
});

// ── Profile Routes ──────────────────────────────────────────────────────────

router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.sub },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      role: true,
      emailVerified: true,
      chargesEnabled: true,
      stripeAccountId: true,
      createdAt: true,
    },
  });

  if (!user) throw new AppError(404, 'User not found');
  res.json(user);
});

router.patch('/me', requireAuth, async (req: Request, res: Response) => {
  const data = updateProfileSchema.parse(req.body);

  const user = await prisma.user.update({
    where: { id: req.user!.sub },
    data,
    select: {
      id: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
      updatedAt: true,
    },
  });

  res.json(user);
});

router.get('/:id', async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) throw new AppError(404, 'User not found');
  res.json(user);
});

// ── Admin Routes ────────────────────────────────────────────────────────────

router.get('/', requireAuth, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    }),
    prisma.user.count(),
  ]);

  res.json({ users, total, page, limit, pages: Math.ceil(total / limit) });
});

export default router;
