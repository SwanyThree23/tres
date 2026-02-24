/**
 * SwanyThree Socket.IO Client — Real-time event handling.
 */

import { io, type Socket } from 'socket.io-client';
import type { ChatMessage, WatchPartySyncPayload, GamificationEvent } from '@/types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

let socket: Socket | null = null;

/** Connect to Socket.IO server with auth token */
export function connectSocket(token?: string): Socket {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    path: '/socket.io/',
    auth: token ? { token } : undefined,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    timeout: 20000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.error('[Socket] Connection error:', err.message);
  });

  return socket;
}

/** Disconnect socket */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/** Get current socket instance */
export function getSocket(): Socket | null {
  return socket;
}

// ── Stream Room ─────────────────────────────────────────────────────

export function joinStream(streamId: string): void {
  socket?.emit('join_stream', { stream_id: streamId });
}

export function leaveStream(streamId: string): void {
  socket?.emit('leave_stream', { stream_id: streamId });
}

export function joinUserRoom(): void {
  socket?.emit('join_user_room', {});
}

// ── Chat ────────────────────────────────────────────────────────────

export function sendChatMessage(streamId: string, content: string, username: string): void {
  socket?.emit('chat_message', {
    stream_id: streamId,
    content,
    username,
    platform: 'native',
  });
}

export function onChatMessage(callback: (msg: ChatMessage) => void): void {
  socket?.on('chat_message', callback);
}

export function offChatMessage(callback: (msg: ChatMessage) => void): void {
  socket?.off('chat_message', callback);
}

// ── Watch Party ─────────────────────────────────────────────────────

export function sendWatchPartyAction(
  streamId: string,
  action: string,
  params?: { time?: number; media_url?: string },
): void {
  socket?.emit('watch_party_action', {
    stream_id: streamId,
    action,
    ...params,
  });
}

export function requestWatchPartySync(streamId: string): void {
  socket?.emit('watch_party_request_sync', { stream_id: streamId });
}

export function onWatchPartySync(callback: (payload: WatchPartySyncPayload) => void): void {
  socket?.on('watch_party_sync', callback);
}

export function offWatchPartySync(callback: (payload: WatchPartySyncPayload) => void): void {
  socket?.off('watch_party_sync', callback);
}

// ── Viewer Count ────────────────────────────────────────────────────

export function onViewerCount(callback: (data: { stream_id: string; count: number }) => void): void {
  socket?.on('viewer_count', callback);
}

export function offViewerCount(callback: (data: { stream_id: string; count: number }) => void): void {
  socket?.off('viewer_count', callback);
}

// ── Panel ───────────────────────────────────────────────────────────

export function joinPanel(streamId: string): void {
  socket?.emit('join_panel', { stream_id: streamId });
}

export function leavePanel(streamId: string): void {
  socket?.emit('leave_panel', { stream_id: streamId });
}

// ── Gamification Events ─────────────────────────────────────────────

export function onGamificationEvent(callback: (event: GamificationEvent) => void): void {
  socket?.on('gamification', callback);
}

export function offGamificationEvent(callback: (event: GamificationEvent) => void): void {
  socket?.off('gamification', callback);
}

// ── Payment Events ──────────────────────────────────────────────────

export function onPaymentReceived(callback: (data: Record<string, unknown>) => void): void {
  socket?.on('payment_received', callback);
}

export function offPaymentReceived(callback: (data: Record<string, unknown>) => void): void {
  socket?.off('payment_received', callback);
}

// ── WebRTC Signaling ────────────────────────────────────────────────

export function sendWebRTCOffer(targetSid: string, offer: RTCSessionDescriptionInit): void {
  socket?.emit('webrtc_offer', { target_sid: targetSid, offer });
}

export function sendWebRTCAnswer(targetSid: string, answer: RTCSessionDescriptionInit): void {
  socket?.emit('webrtc_answer', { target_sid: targetSid, answer });
}

export function sendICECandidate(targetSid: string, candidate: RTCIceCandidate): void {
  socket?.emit('webrtc_ice_candidate', { target_sid: targetSid, candidate });
}
