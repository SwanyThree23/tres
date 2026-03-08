# SwanyThree Platform — Security Documentation

## Authentication & Authorization

### JWT Token Management
- **Access tokens**: HS256, 30-minute expiry
- **Refresh tokens**: 7-day expiry, single-use with rotation
- **Storage**: Access token in memory, refresh token in httpOnly cookie (recommended) or localStorage
- **Invalidation**: Logout endpoint clears refresh token from database

### Password Security
- **Hashing**: bcrypt with 12 rounds (work factor)
- **Requirements**: Minimum 8 characters, must include uppercase, lowercase, and digit
- **Rate limiting**: Login endpoint limited to prevent brute force

### Role-Based Access Control
| Role | Permissions |
|------|------------|
| viewer | Watch streams, chat, tip, earn XP |
| creator | All viewer + create streams, manage guests, receive payments |
| admin | All creator + platform metrics, user management, system health |

## Encryption

### Vault Pro (AES-256-GCM)
- **Purpose**: Encrypts sensitive RTMP streaming keys at rest
- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Key derivation**: PBKDF2-HMAC-SHA256 with 100,000 iterations
- **Salt**: 16-byte random per encryption operation
- **Nonce**: 12-byte random per encryption operation
- **Tamper detection**: GCM authentication tag prevents ciphertext modification
- **Master key**: Derived from `VAULT_MASTER_KEY` environment variable

### Data at Rest
- Database passwords hashed with bcrypt (irreversible)
- RTMP keys encrypted via Vault Pro before database storage
- Stripe tokens stored server-side only, never exposed to frontend

### Data in Transit
- HTTPS enforced in production via nginx
- WebSocket connections upgraded over TLS (wss://)
- Stripe API calls over TLS 1.2+

## API Security

### Rate Limiting
Redis sliding-window rate limiter applied per IP:
| Endpoint Group | Requests/Minute |
|---------------|----------------|
| General API | 120 |
| Admin endpoints | 30 |
| Payment endpoints | 20 |

Headers returned: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

### Input Validation
- Pydantic models validate all request bodies
- SQL injection prevented via SQLAlchemy parameterized queries
- XSS prevented via React's automatic DOM escaping
- Content Security Policy headers set by nginx

### CORS
- Explicit origin allowlist via `CORS_ORIGINS` environment variable
- No wildcard origins in production
- Credentials mode enabled for cookie-based auth

## Payment Security

### Stripe Integration
- Server-side only — secret key never exposed to client
- Webhook signature verification prevents spoofed events
- Idempotency keys on payment creation
- Amount validation server-side (minimum $1.00)

### Revenue Split Integrity
- 90/10 split enforced by PostgreSQL `BEFORE INSERT` trigger
- Cannot be bypassed by application code
- Trigger formula: `processor_fee = amount × 0.029 + 0.30`, `platform_fee = (amount - processor_fee) × 0.10`
- All fee fields are `NOT NULL` — incomplete transactions cannot be stored

## Infrastructure Security

### Docker
- Non-root user in application containers
- Read-only filesystem where possible
- Internal network isolation (services not exposed unless needed)
- Health checks prevent routing to unhealthy containers

### Nginx
- Security headers: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection
- Content-Security-Policy restricting script/style sources
- Request size limits (default 100MB for uploads)
- WebSocket upgrade handling with proper Origin checks

### Environment Variables
- All secrets in `.env` file (gitignored)
- `.env.example` provides template without real values
- Production: Use Docker secrets or Vault for secret management

## Content Moderation

### AI-Powered Moderation
- SwanyAI pipeline analyzes chat messages and content
- Categories: hate, harassment, sexual, violence, self-harm, dangerous
- Confidence scoring with configurable thresholds
- Automatic flag + human review workflow

### Chat Safety
- Message length limit: 500 characters
- Rate limiting on chat messages via Socket.IO
- Host can mute individual guests
- Profanity filtering available via moderation endpoint

## Incident Response

### Monitoring Points
- `/api/admin/health` — Service health status
- Docker container health checks
- Celery task failure logging
- Rate limit exceeded alerts

### Data Breach Protocol
1. Identify scope of compromised data
2. Rotate all JWT secrets and Vault master key
3. Force logout all sessions (clear refresh tokens)
4. Re-encrypt all Vault-protected data with new key
5. Notify affected users per applicable regulations

## Compliance Notes

- Payment processing delegated to Stripe (PCI DSS compliant)
- User passwords never stored in plaintext
- Sensitive keys encrypted at rest
- Audit trail via database timestamps on all records
- GDPR-ready: User data exportable, deletable via admin tools
