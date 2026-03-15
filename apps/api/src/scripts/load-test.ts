import { io } from 'socket.io-client';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

// Ensure standard environment variables
const API_URL = process.env.API_URL || 'http://localhost:3000';
const PRIVATE_KEY = process.env.JWT_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!PRIVATE_KEY) {
  console.error('❌ Missing JWT_PRIVATE_KEY in .env');
  process.exit(1);
}

const TOTAL_CLIENTS = 50; // Configure max simultaneous connections
const clients: any[] = [];
let messagesSent = 0;
let messagesReceived = 0;

// Force generate a fake valid JWT token for auth injection
function generateFakeToken(sub: string) {
  return jwt.sign(
    { sub, email: `tester_${sub}@cylive.com`, role: 'USER', emailVerified: true },
    PRIVATE_KEY!,
    { algorithm: 'RS256', expiresIn: '15m' }
  );
}

async function fetchLiveStage() {
  const req = await fetch(`${API_URL}/stages?status=LIVE`);
  const data = await req.json();
  return data.stages?.[0]?.id; // Grab the first active stage
}

async function simulateClient(index: number, stageId: string) {
  const userId = `tester_id_${index}`;
  const token = generateFakeToken(userId);

  // Connect to the Chat namespace specifically
  const socket = io(`${API_URL}/chat`, {
    auth: { token },
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    // console.log(`🔌 Client ${index} Connected`);
    
    // Join stage chat room
    socket.emit('join:stage', stageId);

    // Periodically send a message every 5-15 seconds
    setInterval(() => {
      socket.emit('message:send', {
        stageId,
        content: `Hello from Load Tester ${index}! 🚀`,
      });
      messagesSent++;
    }, Math.random() * 10000 + 5000);
  });

  socket.on('message:new', (msg) => {
    messagesReceived++;
    // We can print metrics but don't log every message to avoid spam
  });

  socket.on('connect_error', (err) => {
    console.error(`❌ Client ${index} Error:`, err.message);
  });

  clients.push(socket);
}

async function runTest() {
  console.log('🚀 Starting CY Live API Load Tester...');
  console.log(`📡 Target API: ${API_URL}`);
  
  const stageId = await fetchLiveStage();
  if (!stageId) {
    console.warn(`⚠️ No active LIVE stage found via API. Run "npm run seed" first.`);
    process.exit(1);
  }

  console.log(`🏟️ Selected Stage ID: ${stageId}`);
  console.log(`🔌 Spinning up ${TOTAL_CLIENTS} simultaneous socket clients...`);

  for (let i = 0; i < TOTAL_CLIENTS; i++) {
    await simulateClient(i, stageId);
    // Add tiny delay to avoid sudden socket flooding
    await new Promise((r) => setTimeout(r, 50));
  }

  // Periodic metrics heartbeat
  setInterval(() => {
    console.log(`📊 Metrics [10s] — Sent: ${messagesSent} | Received: ${messagesReceived} | Active Clients: ${clients.filter(c => c.connected).length}`);
  }, 10000);
}

runTest().catch((e) => {
  console.error(e);
  process.exit(1);
});
