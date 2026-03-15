// ─────────────────────────────────────────────────────────────────────────────
// CY Live — Socket.io Notifications Handler
// ─────────────────────────────────────────────────────────────────────────────

import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import logger from '../lib/logger.js';
import type { JwtPayload } from '../middleware/auth.js';

const JWT_PUBLIC_KEY = (process.env.JWT_PUBLIC_KEY ?? '').replace(/\\n/g, '\n');

export function registerNotificationHandlers(io: Server) {
  const notifNsp = io.of('/notifications');

  notifNsp.use((socket, next) => {
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

  notifNsp.on('connection', async (socket: Socket) => {
    const user = (socket as any).user as JwtPayload;

    // Join personal notification room
    socket.join(`user:${user.sub}`);

    // Send unread count on connect
    const unreadCount = await prisma.notification.count({
      where: { userId: user.sub, read: false },
    });
    socket.emit('notifications:unread', { count: unreadCount });

    // Mark notifications as read
    socket.on('notifications:read', async (ids: string[]) => {
      await prisma.notification.updateMany({
        where: { id: { in: ids }, userId: user.sub },
        data: { read: true },
      });

      const newCount = await prisma.notification.count({
        where: { userId: user.sub, read: false },
      });
      socket.emit('notifications:unread', { count: newCount });
    });

    // Mark all as read
    socket.on('notifications:readAll', async () => {
      await prisma.notification.updateMany({
        where: { userId: user.sub, read: false },
        data: { read: true },
      });
      socket.emit('notifications:unread', { count: 0 });
    });

    socket.on('disconnect', () => {
      logger.debug({ userId: user.sub }, 'Notification socket disconnected');
    });
  });

  return notifNsp;
}

/**
 * Send notification to a user via socket + persist to DB
 */
export async function sendNotification(
  io: Server,
  userId: string,
  notification: { type: string; title: string; body?: string; data?: any },
) {
  const notif = await prisma.notification.create({
    data: {
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data,
      userId,
    },
  });

  io.of('/notifications').to(`user:${userId}`).emit('notification:new', notif);
  return notif;
}
