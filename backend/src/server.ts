/**
 * SwanyThree Unified Gateway Server (Production)
 * Integrates: 20-Guest Panel, 90/10 Split, Guest Destinations, Watch Party, SwanyThree Ecosystem
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import axios from 'axios';

import { SwanyAIWrapper } from './services/SwanyAIWrapper';
import { GuestStreamingManager } from './services/GuestStreamingManager';
import { processTransaction } from './services/PaymentProcessor';

// ============================================================================
// SERVER INITIALIZATION
// ============================================================================

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const swanyAI = new SwanyAIWrapper();
const guestStreamer = new GuestStreamingManager(redis);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ============================================================================
// API ROUTES
// ============================================================================

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'swanythree-gateway' });
});

// 1. Payment Route (90/10 Split)
app.post('/api/pay', async (req, res) => {
  try {
    const { amount, creatorId, method } = req.body;

    if (!amount || !creatorId || !method) {
      res.status(400).json({ error: 'Missing required fields: amount, creatorId, method' });
      return;
    }

    const result = await processTransaction(amount, creatorId, method);

    // Real-time notification to creator
    io.to(`user:${creatorId}`).emit('payment_received', {
      amount: result.creatorNet,
      message: 'You received a new payment!',
    });

    res.json({ success: true, split: result });
  } catch (err) {
    console.error('Payment error:', err);
    res.status(500).json({ error: 'Payment processing failed' });
  }
});

// 2. Start Guest Destination Fanout
app.post('/api/guest/stream', async (req, res) => {
  try {
    const { guestId, destinations } = req.body;

    if (!guestId || !destinations?.length) {
      res.status(400).json({ error: 'Missing guestId or destinations' });
      return;
    }

    const inputStream = await redis.get(`stream:input:${guestId}`);

    if (inputStream) {
      await guestStreamer.startFanout(guestId, inputStream, destinations);
      res.json({ success: true, message: 'Destinations active' });
    } else {
      res.status(404).json({ error: 'Active stream not found for this guest' });
    }
  } catch (err) {
    console.error('Guest stream error:', err);
    res.status(500).json({ error: 'Failed to start guest destinations' });
  }
});

// 3. Stop Guest Destination Fanout
app.post('/api/guest/stream/stop', async (req, res) => {
  try {
    const { guestId } = req.body;
    await guestStreamer.stopFanout(guestId);
    res.json({ success: true, message: 'Destinations stopped' });
  } catch (err) {
    console.error('Stop stream error:', err);
    res.status(500).json({ error: 'Failed to stop guest destinations' });
  }
});

// 4. Google Translate Integration
app.post('/api/translate', async (req, res) => {
  try {
    const { text, targetLang } = req.body;

    if (!text || !targetLang) {
      res.status(400).json({ error: 'Missing text or targetLang' });
      return;
    }

    const url = `https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_API_KEY}`;
    const response = await axios.post(url, { q: text, target: targetLang });
    res.json({ translatedText: response.data.data.translations[0].translatedText });
  } catch (err) {
    console.error('Translation error:', err);
    res.status(500).json({ error: 'Translation failed' });
  }
});

// 5. AI Chat Endpoint
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages, model } = req.body;
    const response = await swanyAI.chat(messages, model);
    res.json(response.data);
  } catch (err) {
    console.error('AI chat error:', err);
    res.status(500).json({ error: 'AI request failed' });
  }
});

// 6. Moderation Ban Endpoint (Internal - called by SwanyBot worker)
app.post('/api/moderation/ban', async (req, res) => {
  try {
    const { userId, roomId, reason } = req.body;

    await mongoose.connection.collection('bans').insertOne({
      userId,
      roomId,
      reason,
      timestamp: new Date(),
    });

    io.to(roomId).emit('user-banned', { userId, reason });
    res.json({ success: true });
  } catch (err) {
    console.error('Ban error:', err);
    res.status(500).json({ error: 'Ban failed' });
  }
});

// ============================================================================
// WEBSOCKET (SOCKET.IO) - SIGNALING & WATCH PARTY
// ============================================================================

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // A. 20-Guest Panel Management
  socket.on('join-panel', async ({ roomId, userId }) => {
    socket.join(roomId);
    const currentGuests = await redis.scard(`room:${roomId}:guests`);

    if (currentGuests >= 20) {
      socket.emit('error', { message: 'Panel is full (Max 20)' });
      return;
    }

    await redis.sadd(`room:${roomId}:guests`, userId);
    io.to(roomId).emit('panel-update', { count: currentGuests + 1 });
  });

  // Leave panel
  socket.on('leave-panel', async ({ roomId, userId }) => {
    await redis.srem(`room:${roomId}:guests`, userId);
    const currentGuests = await redis.scard(`room:${roomId}:guests`);
    io.to(roomId).emit('panel-update', { count: currentGuests });
    socket.leave(roomId);
  });

  // B. WebRTC Signaling
  socket.on('offer', ({ roomId, offer, targetId }) => {
    socket.to(targetId).emit('offer', { offer, senderId: socket.id });
  });

  socket.on('answer', ({ answer, targetId }) => {
    socket.to(targetId).emit('answer', { answer, senderId: socket.id });
  });

  socket.on('ice-candidate', ({ candidate, targetId }) => {
    socket.to(targetId).emit('ice-candidate', { candidate, senderId: socket.id });
  });

  // C. Watch Party Sync System
  socket.on('watch-party-action', ({ roomId, action, timestamp, mediaUrl }) => {
    io.to(roomId).emit('watch-party-sync', {
      action,
      timestamp,
      mediaUrl,
      serverTime: Date.now(),
    });
  });

  // D. Chat Messages with SwanyBot AI Integration
  socket.on('chat-message', async (data) => {
    // Broadcast user message
    io.to(data.roomId).emit('chat', data);

    // AI Moderation & Interaction (async, non-blocking)
    try {
      const context = `Stream: ${data.roomId}, User: ${data.user}`;
      const compressed = await swanyAI.compressPrompt(
        context,
        'Moderate this message and reply if question.'
      );

      const aiResponse = await swanyAI.chat([
        {
          role: 'system',
          content: 'You are SwanyBot Pro. Moderate chat and answer questions concisely.',
        },
        { role: 'user', content: `${compressed} Message: ${data.message}` },
      ]);

      const botReply = aiResponse.data.choices[0]?.message?.content;
      if (botReply) {
        io.to(data.roomId).emit('chat', {
          user: 'SwanyBot',
          message: botReply,
          type: 'bot',
        });
      }
    } catch (err) {
      console.error('SwanyBot AI error:', err);
    }
  });

  // E. User Room Subscription (for payment notifications)
  socket.on('subscribe-user', ({ userId }) => {
    socket.join(`user:${userId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// ============================================================================
// DATABASE CONNECTION & SERVER START
// ============================================================================

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/swanythree';
const PORT = process.env.PORT || 5000;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    httpServer.listen(PORT, () => {
      console.log(`SwanyThree Production Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

export { app, httpServer, io };
