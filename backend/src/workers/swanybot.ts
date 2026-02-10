/**
 * SwanyBot Pro Ultimate - Chat Moderation Worker
 * Runs as a background BullMQ worker monitoring the chat-moderation queue.
 * Uses LLMLingua + OpenRouter for AI-powered moderation.
 */

import { Worker } from 'bullmq';
import axios from 'axios';
import { SwanyAIWrapper } from '../services/SwanyAIWrapper';

const swanyAI = new SwanyAIWrapper();

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

const worker = new Worker(
  'chat-moderation',
  async (job) => {
    const { message, roomId, userId } = job.data;

    // 1. Detect violation via LLM moderation check
    const moderation = await swanyAI.chat([
      {
        role: 'system',
        content: 'Output JSON only: { "violation": boolean, "reason": string }',
      },
      { role: 'user', content: message },
    ]);

    const result = JSON.parse(moderation.data.choices[0].message.content);

    if (result.violation) {
      // 2. Auto-ban via internal API
      await axios.post(`${BACKEND_URL}/api/moderation/ban`, {
        userId,
        roomId,
        reason: result.reason,
      });
      return { status: 'banned', reason: result.reason };
    }

    return { status: 'clean' };
  },
  {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    },
  }
);

worker.on('completed', (job) => {
  console.log(`Moderation job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Moderation job ${job?.id} failed:`, err.message);
});

console.log('SwanyBot Pro Ultimate moderation worker started');
