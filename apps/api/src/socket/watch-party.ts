// ─────────────────────────────────────────────────────────────────────────────
// CY Live — Socket.io Watch Party Handler
// ─────────────────────────────────────────────────────────────────────────────

import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../lib/logger.js';
import type { JwtPayload } from '../middleware/auth.js';

const JWT_PUBLIC_KEY = (process.env.JWT_PUBLIC_KEY ?? '').replace(/\\n/g, '\n');

export function registerWatchPartyHandlers(io: Server) {
  const wpNsp = io.of('/watch-party');

  wpNsp.use((socket, next) => {
    const token = socket.handshake.auth?.token as string;
    if (!token) return next(new Error('Authentication required'));

    try {
      const payload = jwt.verify(token, JWT_PUBLIC_KEY, {
        algorithms: ['RS256'],
      }) as JwtPayload;
      (socket as any).user = payload;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  wpNsp.on('connection', (socket: Socket) => {
    const user = (socket as any).user as JwtPayload;

    socket.on('wp:join', (partyId: string) => {
      socket.join(`wp:${partyId}`);
      wpNsp.to(`wp:${partyId}`).emit('wp:member:joined', {
        userId: user.sub,
        timestamp: new Date().toISOString(),
      });
    });

    // Sync playback state
    socket.on('wp:sync', (data: { partyId: string; timestamp: number; playing: boolean }) => {
      socket.to(`wp:${data.partyId}`).emit('wp:sync', {
        timestamp: data.timestamp,
        playing: data.playing,
        syncedBy: user.sub,
      });
    });

    // Watch party chat
    socket.on('wp:message', (data: { partyId: string; content: string }) => {
      if (!data.content?.trim()) return;
      wpNsp.to(`wp:${data.partyId}`).emit('wp:message', {
        userId: user.sub,
        content: data.content.trim(),
        timestamp: new Date().toISOString(),
      });
    });

    // Reactions
    socket.on('wp:reaction', (data: { partyId: string; emoji: string }) => {
      wpNsp.to(`wp:${data.partyId}`).emit('wp:reaction', {
        userId: user.sub,
        emoji: data.emoji,
      });
    });

    socket.on('wp:leave', (partyId: string) => {
      socket.leave(`wp:${partyId}`);
      wpNsp.to(`wp:${partyId}`).emit('wp:member:left', {
        userId: user.sub,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('disconnect', () => {
      logger.debug({ userId: user.sub }, 'Watch party socket disconnected');
    });
  });
}
