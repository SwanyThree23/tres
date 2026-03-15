// ─────────────────────────────────────────────────────────────────────────────
// CY Live — Pino Logger
// ─────────────────────────────────────────────────────────────────────────────

import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProduction ? 'info' : 'debug'),
  ...(isProduction
    ? {
        // Production: JSON output to stdout (PM2 log-rotate handles files)
        timestamp: pino.stdTimeFunctions.isoTime,
        formatters: {
          level: (label: string) => ({ level: label }),
        },
      }
    : {
        // Dev: pretty print
        transport: {
          target: 'pino/file',
          options: { destination: 1 }, // stdout
        },
        timestamp: pino.stdTimeFunctions.isoTime,
      }),
});

export default logger;
