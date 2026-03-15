// ─────────────────────────────────────────────────────────────────────────────
// CY Live — Auth Middleware  |  RS256 Asymmetric JWT
// ─────────────────────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../lib/logger.js';

// Load RSA keys from ENV (newlines escaped as \\n in .env)
const JWT_PUBLIC_KEY = (process.env.JWT_PUBLIC_KEY ?? '').replace(/\\n/g, '\n');

export interface JwtPayload {
  sub: string;        // user id
  email: string;
  role: string;
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Verify RS256 access token from Authorization: Bearer <token>
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_PUBLIC_KEY, {
      algorithms: ['RS256'],
    }) as JwtPayload;

    if (payload.type !== 'access') {
      res.status(401).json({ error: 'Invalid token type' });
      return;
    }

    req.user = payload;
    next();
  } catch (err) {
    logger.warn({ err }, 'JWT verification failed');
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Require specific role(s)
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}

/**
 * Optional auth — sets req.user if token present, but doesn't reject
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_PUBLIC_KEY, {
      algorithms: ['RS256'],
    }) as JwtPayload;
    if (payload.type === 'access') {
      req.user = payload;
    }
  } catch {
    // Token invalid — continue without user
  }
  next();
}
