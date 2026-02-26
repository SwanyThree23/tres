/**
 * SwanyThree Unified Gateway Server (Production)
 * Integrates: 20-Guest Panel, 90/10 Split, Guest Destinations, Watch Party, SwanyThree Ecosystem
 *
 * COMPLIANCE LAYER:
 * - Transparent fee disclosure (no false advertising)
 * - Fuzzed geolocation (no precise viewer tracking)
 * - Watch Party URL validation (DMCA protection)
 * - Multistreaming compliance acknowledgment (platform TOS)
 * - Creator ID verification for private/paid panels (CSAM/trafficking prevention)
 * - Content safety integration (NCMEC hash matching)
 * - AI content watermarking and voice consent verification
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
import { processTransaction, getFeeDisclosure } from './services/PaymentProcessor';
import { fuzzLocation, aggregateViewerLocations } from './services/GeolocationPrivacy';
import { validateWatchPartyUrl } from './services/WatchPartyValidator';
import { CreatorVerification } from './services/CreatorVerification';
import { ContentSafety } from './services/ContentSafety';
import { AIContentWatermark } from './services/AIContentWatermark';
import { VoiceConsentService } from './services/VoiceConsentService';

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
const creatorVerification = new CreatorVerification();
const contentSafety = new ContentSafety();
const voiceConsent = new VoiceConsentService();

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

// ---- COMPLIANCE: Fee Disclosure Endpoint ----
// Returns transparent fee structure for display in UI
app.get('/api/fees', (_req, res) => {
  res.json(getFeeDisclosure());
});

// 1. Payment Route (90/10 Split) — Compliance-aware
app.post('/api/pay', async (req, res) => {
  try {
    const { amount, creatorId, method } = req.body;

    if (!amount || !creatorId || !method) {
      res.status(400).json({ error: 'Missing required fields: amount, creatorId, method' });
      return;
    }

    const result = await processTransaction(amount, creatorId, method);

    // Real-time notification to creator with fee disclosure
    io.to(`user:${creatorId}`).emit('payment_received', {
      amount: result.creatorNet,
      feeDisclosure: result.feeDisclosure,
      message: 'You received a new payment!',
    });

    res.json({ success: true, split: result });
  } catch (err) {
    console.error('Payment error:', err);
    res.status(500).json({ error: 'Payment processing failed' });
  }
});

// 2. Start Guest Destination Fanout — with compliance gate
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
  } catch (err: any) {
    console.error('Guest stream error:', err);
    // Surface compliance errors to the client
    if (err.message?.includes('compliance')) {
      res.status(403).json({ error: err.message });
    } else {
      res.status(500).json({ error: 'Failed to start guest destinations' });
    }
  }
});

// 2b. Multistreaming compliance acknowledgment
app.post('/api/guest/stream/acknowledge', async (req, res) => {
  try {
    const { guestId } = req.body;
    if (!guestId) {
      res.status(400).json({ error: 'Missing guestId' });
      return;
    }
    await guestStreamer.recordComplianceAck(guestId);
    res.json({ success: true, message: 'Multistreaming compliance acknowledged' });
  } catch (err) {
    console.error('Compliance ack error:', err);
    res.status(500).json({ error: 'Failed to record acknowledgment' });
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

// ---- COMPLIANCE: Watch Party URL Validation ----
app.post('/api/watch-party/validate', (req, res) => {
  const { url } = req.body;
  if (!url) {
    res.status(400).json({ error: 'Missing url' });
    return;
  }
  const result = validateWatchPartyUrl(url);
  res.json(result);
});

// ---- COMPLIANCE: Geolocation Privacy (Fuzzed only) ----
app.post('/api/viewers/locations', async (req, res) => {
  try {
    const { viewers } = req.body;
    // Aggregate and fuzz — never return precise coordinates
    const fuzzed = aggregateViewerLocations(viewers || []);
    res.json({ locations: fuzzed });
  } catch (err) {
    console.error('Geolocation error:', err);
    res.status(500).json({ error: 'Failed to process viewer locations' });
  }
});

// ---- COMPLIANCE: Creator ID Verification ----
app.post('/api/creator/verify', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      res.status(400).json({ error: 'Missing userId' });
      return;
    }
    const session = await creatorVerification.createVerificationSession(userId);
    res.json({ success: true, clientSecret: session.clientSecret });
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ error: 'Failed to create verification session' });
  }
});

app.get('/api/creator/verify/status/:userId', async (req, res) => {
  try {
    const status = await creatorVerification.getStatus(req.params.userId);
    res.json({ status });
  } catch (err) {
    console.error('Verification status error:', err);
    res.status(500).json({ error: 'Failed to get verification status' });
  }
});

// Stripe Identity webhook handler
app.post('/api/webhooks/stripe-identity', async (req, res) => {
  try {
    await creatorVerification.handleWebhook(req.body);
    res.json({ received: true });
  } catch (err) {
    console.error('Stripe Identity webhook error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ---- COMPLIANCE: Content Safety / Admin stream review ----
app.get('/api/admin/stream-snapshots/:roomId', async (req, res) => {
  try {
    const snapshots = await contentSafety.getStreamSnapshots(req.params.roomId);
    res.json({ snapshots });
  } catch (err) {
    console.error('Snapshot retrieval error:', err);
    res.status(500).json({ error: 'Failed to retrieve snapshots' });
  }
});

// ---- COMPLIANCE: AI Watermark Generation ----
app.post('/api/ai/watermark', (req, res) => {
  const { userId, contentType } = req.body;
  if (!userId || !contentType) {
    res.status(400).json({ error: 'Missing userId or contentType' });
    return;
  }
  const watermark = AIContentWatermark.generateWatermark(userId, contentType);
  res.json({ watermark });
});

// ---- COMPLIANCE: Voice Consent ----
app.post('/api/voice/challenge', (_req, res) => {
  const challenge = voiceConsent.generateChallenge();
  res.json(challenge);
});

app.post('/api/voice/consent', async (req, res) => {
  try {
    const { userId, challengeId } = req.body;
    if (!userId || !challengeId) {
      res.status(400).json({ error: 'Missing userId or challengeId' });
      return;
    }
    await voiceConsent.recordConsent(userId, challengeId);
    res.json({ success: true, message: 'Voice consent recorded' });
  } catch (err) {
    console.error('Voice consent error:', err);
    res.status(500).json({ error: 'Failed to record consent' });
  }
});

app.post('/api/voice/revoke', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      res.status(400).json({ error: 'Missing userId' });
      return;
    }
    await voiceConsent.revokeConsent(userId);
    res.json({ success: true, message: 'Voice consent revoked' });
  } catch (err) {
    console.error('Voice revoke error:', err);
    res.status(500).json({ error: 'Failed to revoke consent' });
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
  socket.on('offer', ({ offer, targetId }) => {
    socket.to(targetId).emit('offer', { offer, senderId: socket.id });
  });

  socket.on('answer', ({ answer, targetId }) => {
    socket.to(targetId).emit('answer', { answer, senderId: socket.id });
  });

  socket.on('ice-candidate', ({ candidate, targetId }) => {
    socket.to(targetId).emit('ice-candidate', { candidate, senderId: socket.id });
  });

  // C. Watch Party Sync System — with URL validation
  socket.on('watch-party-action', ({ roomId, action, timestamp, mediaUrl }) => {
    // COMPLIANCE: Validate Watch Party URLs before broadcasting
    if (action === 'load' && mediaUrl) {
      const validation = validateWatchPartyUrl(mediaUrl);
      if (!validation.valid) {
        socket.emit('error', {
          message: `Watch Party URL rejected: ${validation.reason}`,
        });
        return;
      }
    }

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

  // F. Viewer location reporting — fuzzed to region level only
  socket.on('report-location', (data) => {
    const fuzzed = fuzzLocation(data);
    // Only broadcast the fuzzed label, never raw coordinates
    io.to(data.roomId).emit('viewer-location', fuzzed);
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
