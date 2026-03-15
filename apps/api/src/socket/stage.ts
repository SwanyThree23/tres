// ─────────────────────────────────────────────────────────────────────────────
// CY Live — Socket.io Stage Handler  |  Real-time stage events
// ─────────────────────────────────────────────────────────────────────────────

import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from '../../lib/prisma.js';
import logger from '../../lib/logger.js';
import type { JwtPayload } from '../../middleware/auth.js';

const JWT_PUBLIC_KEY = (process.env.JWT_PUBLIC_KEY ?? '').replace(/\\n/g, '\n');

export function registerStageHandlers(io: Server) {
  const stageNsp = io.of('/stage');

  stageNsp.use((socket, next) => {
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

  stageNsp.on('connection', (socket: Socket) => {
    const user = (socket as any).user as JwtPayload;

    // Join stage room
    socket.on('stage:join', async (stageId: string) => {
      socket.join(`stage:${stageId}`);

      // Track as guest viewer
      try {
        await prisma.stageGuest.upsert({
          where: {
            stageId_userId: { stageId, userId: user.sub },
          },
          update: { leftAt: null },
          create: {
            stageId,
            userId: user.sub,
            role: 'VIEWER',
          },
        });

        // Update viewer count
        const count = await prisma.stageGuest.count({
          where: { stageId, leftAt: null },
        });

        await prisma.stage.update({
          where: { id: stageId },
          data: {
            viewerCount: count,
            peakViewers: { set: undefined },
          },
        });

        // Update peak viewers separately
        const stage = await prisma.stage.findUnique({ where: { id: stageId } });
        if (stage && count > stage.peakViewers) {
          await prisma.stage.update({
            where: { id: stageId },
            data: { peakViewers: count },
          });
        }

        stageNsp.to(`stage:${stageId}`).emit('stage:viewers', { count });
      } catch (err) {
        logger.error({ err }, 'Stage join error');
      }
    });

    // Leave stage
    socket.on('stage:leave', async (stageId: string) => {
      socket.leave(`stage:${stageId}`);

      try {
        await prisma.stageGuest.updateMany({
          where: { stageId, userId: user.sub },
          data: { leftAt: new Date() },
        });

        const count = await prisma.stageGuest.count({
          where: { stageId, leftAt: null },
        });

        await prisma.stage.update({
          where: { id: stageId },
          data: { viewerCount: count },
        });

        stageNsp.to(`stage:${stageId}`).emit('stage:viewers', { count });
      } catch (err) {
        logger.error({ err }, 'Stage leave error');
      }
    });

    // Super chat notification (broadcast to stage)
    socket.on('stage:superchat', (data: {
      stageId: string;
      fromUser: { username: string; displayName: string };
      amount: number;
      message: string;
    }) => {
      stageNsp.to(`stage:${data.stageId}`).emit('superchat:received', data);
    });

    socket.on('disconnect', () => {
      logger.debug({ userId: user.sub }, 'Stage socket disconnected');
    });
  });
}
