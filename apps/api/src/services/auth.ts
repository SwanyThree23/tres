// ─────────────────────────────────────────────────────────────────────────────
// CY Live — Auth Service  |  RS256 JWT · 15min access / 30-day refresh
// ─────────────────────────────────────────────────────────────────────────────

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../lib/prisma.js';
import redis from '../lib/redis.js';
import logger from '../lib/logger.js';
import type { JwtPayload } from '../middleware/auth.js';

const JWT_PRIVATE_KEY = (process.env.JWT_PRIVATE_KEY ?? '').replace(/\\n/g, '\n');
const JWT_PUBLIC_KEY = (process.env.JWT_PUBLIC_KEY ?? '').replace(/\\n/g, '\n');

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 30;
const REFRESH_TOKEN_EXPIRY = `${REFRESH_TOKEN_EXPIRY_DAYS}d`;
const SALT_ROUNDS = 12;

// ── Token Generation ─────────────────────────────────────────────────────────

function signAccessToken(user: { id: string; email: string; role: string }): string {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, type: 'access' },
    JWT_PRIVATE_KEY,
    { algorithm: 'RS256', expiresIn: ACCESS_TOKEN_EXPIRY },
  );
}

function signRefreshToken(user: { id: string; email: string; role: string }): string {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, type: 'refresh' },
    JWT_PRIVATE_KEY,
    { algorithm: 'RS256', expiresIn: REFRESH_TOKEN_EXPIRY },
  );
}

// ── Auth Operations ──────────────────────────────────────────────────────────

export async function register(data: {
  email: string;
  password: string;
  username: string;
  displayName?: string;
}) {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: data.email }, { username: data.username }] },
  });

  if (existing) {
    if (existing.email === data.email) throw new Error('Email already registered');
    throw new Error('Username already taken');
  }

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  const emailVerifyToken = crypto.randomBytes(32).toString('hex');

  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase().trim(),
      passwordHash,
      username: data.username.toLowerCase().trim(),
      displayName: data.displayName ?? data.username,
      emailVerifyToken,
    },
  });

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  // Store refresh token hash
  const refreshHash = await bcrypt.hash(refreshToken, SALT_ROUNDS);
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshTokenHash: refreshHash },
  });

  logger.info({ userId: user.id }, 'User registered');

  return {
    user: { id: user.id, email: user.email, username: user.username, role: user.role },
    accessToken,
    refreshToken,
    emailVerifyToken,
  };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user) throw new Error('Invalid credentials');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error('Invalid credentials');

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  // Store refresh token hash
  const refreshHash = await bcrypt.hash(refreshToken, SALT_ROUNDS);
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshTokenHash: refreshHash },
  });

  logger.info({ userId: user.id }, 'User logged in');

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
    },
    accessToken,
    refreshToken,
  };
}

export async function refreshTokens(refreshToken: string) {
  let payload: JwtPayload;
  try {
    payload = jwt.verify(refreshToken, JWT_PUBLIC_KEY, {
      algorithms: ['RS256'],
    }) as JwtPayload;
  } catch {
    throw new Error('Invalid refresh token');
  }

  if (payload.type !== 'refresh') throw new Error('Invalid token type');

  // Check if token is blacklisted
  const blacklisted = await redis.get(`bl:${payload.sub}:${payload.iat}`);
  if (blacklisted) throw new Error('Token revoked');

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw new Error('User not found');

  // Verify stored hash matches
  if (!user.refreshTokenHash) throw new Error('No active session');
  const valid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
  if (!valid) throw new Error('Token revoked');

  // Rotate: issue new pair, blacklist old refresh
  const newAccessToken = signAccessToken(user);
  const newRefreshToken = signRefreshToken(user);

  const newRefreshHash = await bcrypt.hash(newRefreshToken, SALT_ROUNDS);
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshTokenHash: newRefreshHash },
  });

  // Blacklist old refresh token
  await redis.set(
    `bl:${payload.sub}:${payload.iat}`,
    '1',
    'EX',
    REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60,
  );

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

export async function logout(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshTokenHash: null },
  });
  logger.info({ userId }, 'User logged out');
}

export async function verifyEmail(token: string) {
  const user = await prisma.user.findFirst({
    where: { emailVerifyToken: token },
  });

  if (!user) throw new Error('Invalid verification token');

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, emailVerifyToken: null },
  });

  return { success: true };
}

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  // Always return success to prevent email enumeration
  if (!user) return { success: true };

  const token = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 1_800_000); // 30 minutes

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetToken: token, passwordResetExpiry: expiry },
  });

  return { success: true, token, userId: user.id };
}

export async function resetPassword(token: string, newPassword: string) {
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpiry: { gte: new Date() },
    },
  });

  if (!user) throw new Error('Invalid or expired reset token');

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiry: null,
      refreshTokenHash: null, // Invalidate all sessions
    },
  });

  return { success: true };
}
