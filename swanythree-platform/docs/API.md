# SwanyThree Platform — API Reference

Base URL: `https://api.swanythree.com` (production) | `http://localhost:8000` (development)

All endpoints return JSON. Authentication via `Authorization: Bearer <token>` header.

---

## Authentication

### POST /api/auth/register
Create a new account.
```json
{
  "username": "string (3-30 chars, alphanumeric + underscore)",
  "email": "string (valid email)",
  "password": "string (min 8 chars, requires upper + lower + digit)",
  "display_name": "string (optional)"
}
```
**Response 201**: `{ user, access_token, refresh_token }`

### POST /api/auth/login
```json
{ "email": "string", "password": "string" }
```
**Response 200**: `{ user, access_token, refresh_token }`

### POST /api/auth/refresh
```json
{ "refresh_token": "string" }
```
**Response 200**: `{ access_token, refresh_token }`

### POST /api/auth/logout
**Auth required**. Invalidates the current refresh token.
**Response 200**: `{ message: "Logged out" }`

### GET /api/auth/me
**Auth required**. Returns the authenticated user's profile.
**Response 200**: `{ user }`

---

## Users

### GET /api/users/:userId
Public profile lookup.
**Response 200**: `{ user }`

### PATCH /api/users/me
**Auth required**. Update own profile (display_name, bio, avatar_url, social_links).
**Response 200**: `{ user }`

### POST /api/users/:userId/follow
**Auth required**. Follow a user. Increments follower_count via trigger.
**Response 200**: `{ message: "Followed" }`

### DELETE /api/users/:userId/follow
**Auth required**. Unfollow a user.
**Response 200**: `{ message: "Unfollowed" }`

### GET /api/users/:userId/followers?page=1&page_size=20
Paginated followers list.

### GET /api/users/:userId/following?page=1&page_size=20
Paginated following list.

---

## Streams

### POST /api/streams
**Auth required**. Create a stream.
```json
{
  "title": "string",
  "description": "string (optional)",
  "category": "string",
  "max_guests": "int (1-20, default 8)"
}
```
**Response 201**: `{ stream }` (includes `stream_key` and `rtmp_url`)

### GET /api/streams?page=1&page_size=20&category=&status=live
Paginated stream listing with filters.

### GET /api/streams/:streamId
Stream details.

### POST /api/streams/:streamId/live
**Auth required (owner)**. Transition stream to `live` status. Generates HLS URL.

### POST /api/streams/:streamId/end
**Auth required (owner)**. End a live stream.

### GET /api/streams/:streamId/guests
List current panel guests (max 20).

### POST /api/streams/:streamId/guests/invite
**Auth required (owner)**. Invite a user to the guest panel.
```json
{ "user_id": "uuid" }
```

---

## Payments & Revenue

### POST /api/payments/tip
**Auth required**. Send a tip during a stream.
```json
{
  "stream_id": "uuid",
  "amount": "number (min 1.00)"
}
```
Fee calculation: `processor_fee = amount × 0.029 + 0.30`, `platform_fee = (amount - processor_fee) × 0.10`, `creator_net = amount - processor_fee - platform_fee`.

### POST /api/payments/paywall
**Auth required**. Pay for paywalled content.
```json
{ "stream_id": "uuid", "amount": "number" }
```

### GET /api/payments/calculate-fees?amount=10.00
Preview fee breakdown for a given amount.

### GET /api/payments/revenue?period=30d
**Auth required**. Creator revenue summary.

### GET /api/payments/transactions?page=1&page_size=20
**Auth required**. Transaction history.

### POST /api/payments/webhook
Stripe webhook endpoint (signature verified).

---

## Gamification

### GET /api/gamification/profile
**Auth required**. XP, level, streak, title.

### POST /api/gamification/award-xp
**Auth required**. Award XP for an action.
```json
{ "action": "string (e.g. go_live, send_chat, tip_sent)" }
```

### POST /api/gamification/update-streak
**Auth required**. Check and update daily streak.

### GET /api/gamification/leaderboard?period=weekly&limit=50
Public leaderboard.

### GET /api/gamification/challenges
Active weekly challenges.

### GET /api/gamification/badges
User's earned badges.

---

## Watch Party

### POST /api/watch-party/create
**Auth required**. Create a synchronized watch party.
```json
{ "stream_id": "uuid", "video_url": "string" }
```

### POST /api/watch-party/:partyId/action
**Auth required (host)**. Send a playback action.
```json
{ "action": "play | pause | seek | load", "position": "number (optional)", "url": "string (optional)" }
```

### GET /api/watch-party/:partyId/sync
Get current playback state with server timestamp for drift correction.

### POST /api/watch-party/:partyId/end
**Auth required (host)**. End the watch party.

---

## Destinations (Multi-Platform Fanout)

### POST /api/destinations/seal-key
**Auth required**. Encrypt and store an RTMP key via Vault Pro.
```json
{ "platform": "youtube | twitch | kick | facebook | x", "rtmp_key": "string" }
```

### POST /api/destinations/:streamId/start
**Auth required (owner)**. Start FFmpeg fanout to enabled destinations.

### POST /api/destinations/:streamId/stop
**Auth required (owner)**. Stop all fanout processes.

### GET /api/destinations/:streamId/status
Get per-platform fanout status (running, stopped, error).

---

## AI Services

### GET /api/ai/health
AI service health check.

### POST /api/ai/moderate
Content moderation via SwanyAI pipeline.
```json
{ "content": "string" }
```
**Response**: `{ safe, category, confidence, reason }`

### POST /api/ai/chat
SwanyBot AI co-host response generation.
```json
{ "messages": [{ "role": "user", "content": "string" }], "task": "string (optional)" }
```

### POST /api/ai/transcribe
Audio transcription via Whisper.
```json
{ "audio_url": "string" }
```

### GET /api/ai/models
Available model listing.

---

## Chat

### POST /api/chat/send
**Auth required**. Persist a chat message.
```json
{ "stream_id": "uuid", "content": "string (max 500 chars)" }
```

### GET /api/chat/:streamId/history?limit=50&before=timestamp
Chat message history.

---

## Recordings

### GET /api/recordings?stream_id=uuid&page=1
List recordings for a stream.

### GET /api/recordings/:recordingId
Recording details (includes signed R2 URL).

### DELETE /api/recordings/:recordingId
**Auth required (owner)**. Delete a recording.

### POST /api/recordings/:streamId/upload
**Auth required (owner)**. Trigger recording upload to Cloudflare R2.

---

## Admin

### GET /api/admin/metrics
**Admin only**. Platform-wide metrics (users, streams, revenue, transactions).

### GET /api/admin/users?page=1&page_size=20&search=
**Admin only**. User management with search.

### GET /api/admin/health
**Admin only**. Service health status (database, redis, ai, storage).

---

## WebSocket Events (Socket.IO)

**Namespace**: `/`

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `join_stream` | `{ stream_id }` | Join a stream room |
| `leave_stream` | `{ stream_id }` | Leave a stream room |
| `join_panel` | `{ stream_id }` | Join guest panel (max 20) |
| `chat_message` | `{ stream_id, content, username }` | Send chat |
| `watch_party_action` | `{ party_id, action, position?, url? }` | Watch party control |
| `webrtc_offer` | `{ target_sid, sdp }` | WebRTC signaling |
| `webrtc_answer` | `{ target_sid, sdp }` | WebRTC signaling |
| `webrtc_ice_candidate` | `{ target_sid, candidate }` | ICE candidate |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `chat_message` | `ChatMessage` | Incoming chat |
| `viewer_count` | `{ count }` | Updated viewer count |
| `panel_update` | `{ guests[] }` | Guest panel changes |
| `watch_party_sync` | `WatchPartyState` | Playback sync |
| `gamification_event` | `GamificationEvent` | XP, level up, badge, etc. |
| `payment_received` | `{ type, amount, ... }` | Tip/payment notification |
| `webrtc_offer` | `{ from_sid, sdp }` | Incoming offer |
| `webrtc_answer` | `{ from_sid, sdp }` | Incoming answer |
| `webrtc_ice_candidate` | `{ from_sid, candidate }` | ICE candidate |

---

## Rate Limits

| Endpoint Group | Limit |
|---------------|-------|
| Default | 120 requests/min |
| Admin | 30 requests/min |
| Payments | 20 requests/min |

Rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

## Error Format

```json
{
  "detail": "Human-readable error message"
}
```

HTTP status codes: 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (not found), 409 (conflict), 422 (validation), 429 (rate limited), 500 (server error).
