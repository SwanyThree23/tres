// ─────────────────────────────────────────────────────────────────────────────
// CY Live — Prisma Client Singleton
// ─────────────────────────────────────────────────────────────────────────────

import { PrismaClient } from '@prisma/client';
import logger from './logger.js';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'production'
        ? [{ emit: 'event', level: 'error' }]
        : [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'warn' },
          ],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Forward Prisma logs to Pino
prisma.$on('error' as never, (e: { message: string }) => {
  logger.error({ prisma: true }, e.message);
});

export default prisma;
