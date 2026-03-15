// ─────────────────────────────────────────────────────────────────────────────
// CY Live — API Server  |  Express 5 + Socket.io 4 + Redis Adapter
// ─────────────────────────────────────────────────────────────────────────────

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';

import logger from './lib/logger.js';
import { redisPub, redisSub } from './lib/redis.js';

// Middleware
import { apiLimiter } from './middleware/rate-limit.js';
import { notFoundHandler, errorHandler } from './middleware/error.js';

// Routes
import usersRouter from './routes/users.js';
import stagesRouter from './routes/stages.js';
import streamKeysRouter from './routes/stream-keys.js';
import transactionsRouter from './routes/transactions.js';
import subscriptionsRouter from './routes/subscriptions.js';
import productsRouter from './routes/products.js';
import watchPartyRouter from './routes/watch-party.js';
import vdoRouter from './routes/vdo.js';
import auraRouter from './routes/aura.js';
import webhooksRouter from './routes/webhooks.js';

// Socket handlers
import { registerChatHandlers } from './socket/chat.js';
import { registerStageHandlers } from './socket/stage.js';
import { registerWatchPartyHandlers } from './socket/watch-party.js';
import { registerNotificationHandlers } from './socket/notifications.js';

// ── App Setup ────────────────────────────────────────────────────────────────

const app = express();
const httpServer = createServer(app);

const PORT = parseInt(process.env.PORT ?? '4000', 10);
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'https://cylive.com';

// ── Global Middleware ────────────────────────────────────────────────────────

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.use(compression());
app.use(cookieParser());

// Request logging
app.use(pinoHttp({
  logger,
  autoLogging: { ignore: (req) => req.url === '/health' },
}));

// ── Stripe Webhook (raw body — MUST be before express.json) ─────────────────
app.use(
  '/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
);

// ── JSON body parser ────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Rate Limiting ───────────────────────────────────────────────────────────
app.use('/api', apiLimiter);

// ── Health Check ────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
  });
});

// ── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/users', usersRouter);
app.use('/api/stages', stagesRouter);
app.use('/api/stream-keys', streamKeysRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/products', productsRouter);
app.use('/api/watch-party', watchPartyRouter);
app.use('/api/vdo', vdoRouter);
app.use('/api/aura', auraRouter);
app.use('/api/webhooks', webhooksRouter);

// ── Error Handling ──────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Socket.io Setup ─────────────────────────────────────────────────────────

const io = new Server(httpServer, {
  cors: {
    origin: [FRONTEND_URL, 'http://localhost:3000'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Connect Redis adapter for Socket.io
async function setupSocketRedis() {
  try {
    await redisPub.connect();
    await redisSub.connect();
    io.adapter(createAdapter(redisPub, redisSub));
    logger.info('Socket.io Redis adapter connected');
  } catch (err) {
    logger.error({ err }, 'Socket.io Redis adapter failed — using in-memory');
  }
}

// Register socket handlers
registerChatHandlers(io);
registerStageHandlers(io);
registerWatchPartyHandlers(io);
registerNotificationHandlers(io);

// ── Start Server ────────────────────────────────────────────────────────────

async function start() {
  await setupSocketRedis();

  httpServer.listen(PORT, '0.0.0.0', () => {
    logger.info(`🚀 CY Live API running on port ${PORT}`);
    logger.info(`📡 WebSocket server ready`);
    logger.info(`🔗 Frontend: ${FRONTEND_URL}`);
    logger.info(`📋 Health: http://localhost:${PORT}/health`);
  });
}

start().catch((err) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down...');
  io.close();
  httpServer.close();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export { app, io, httpServer };
