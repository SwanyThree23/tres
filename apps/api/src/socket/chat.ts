// ─────────────────────────────────────────────────────────────────────────────
// CY Live — Socket.io Chat Handler
// ─────────────────────────────────────────────────────────────────────────────

import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from '../../lib/prisma.js';
import logger from '../../lib/logger.js';
import type { JwtPayload } from '../../middleware/auth.js';

const JWT_PUBLIC_KEY = (process.env.JWT_PUBLIC_KEY ?? '').replace(/\\n/g, '\n');

export function registerChatHandlers(io: Server) {
  const chatNsp = io.of('/chat');

  // Auth middleware for socket
  chatNsp.use((socket, next) => {
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

  chatNsp.on('connection', (socket: Socket) => {
    const user = (socket as any).user as JwtPayload;
    logger.info({ userId: user.sub }, 'Chat socket connected');

    // Join a stage chat room
    socket.on('join:stage', async (stageId: string) => {
      socket.join(`stage:${stageId}`);
      logger.debug({ userId: user.sub, stageId }, 'Joined stage chat');

      // Notify room
      chatNsp.to(`stage:${stageId}`).emit('user:joined', {
        userId: user.sub,
        timestamp: new Date().toISOString(),
      });
    });

    // Send chat message
    socket.on('message:send', async (data: { stageId: string; content: string }) => {
      if (!data.content?.trim() || data.content.length > 500) return;

      try {
        const message = await prisma.chatMessage.create({
          data: {
            content: data.content.trim(),
            stageId: data.stageId,
            userId: user.sub,
          },
          include: {
            user: {
              select: { id: true, username: true, displayName: true, avatarUrl: true },
            },
          },
        });

        chatNsp.to(`stage:${data.stageId}`).emit('message:new', message);
      } catch (err) {
        logger.error({ err }, 'Failed to save chat message');
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Delete message (mod/admin only)
    socket.on('message:delete', async (messageId: string) => {
      if (user.role !== 'ADMIN' && user.role !== 'CREATOR') return;

      await prisma.chatMessage.update({
        where: { id: messageId },
        data: { deleted: true },
      });

      // Broadcast deletion
      chatNsp.emit('message:deleted', { messageId });
    });

    // Leave stage
    socket.on('leave:stage', (stageId: string) => {
      socket.leave(`stage:${stageId}`);
      chatNsp.to(`stage:${stageId}`).emit('user:left', {
        userId: user.sub,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('disconnect', () => {
      logger.debug({ userId: user.sub }, 'Chat socket disconnected');
    });
  });
}
