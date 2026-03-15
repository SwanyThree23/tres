// ─────────────────────────────────────────────────────────────────────────────
// CY Live — Encryption Service  |  AES-256-GCM
// ─────────────────────────────────────────────────────────────────────────────

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  }
  return Buffer.from(key, 'hex');
}

/**
 * Encrypt a string using AES-256-GCM
 * Returns: iv:encrypted:tag (hex encoded)
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${encrypted}:${tag.toString('hex')}`;
}

/**
 * Decrypt an AES-256-GCM encrypted string
 */
export function decrypt(ciphertext: string): string {
  const key = getKey();
  const parts = ciphertext.split(':');
  if (parts.length !== 3) throw new Error('Invalid ciphertext format');

  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const tag = Buffer.from(parts[2], 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Hash a value with SHA-256 (one-way)
 */
export function hash(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/**
 * Generate a random token
 */
export function generateToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}
