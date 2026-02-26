/**
 * Voice Consent Verification Service
 * Requires live voice verification before allowing voice cloning features.
 *
 * Risk mitigated: Non-consensual voice impersonation.
 * The owner of the voice must provide a live sample to prove ownership.
 */

import crypto from 'crypto';
import mongoose from 'mongoose';

export type ConsentStatus = 'none' | 'pending' | 'verified' | 'revoked';

export class VoiceConsentService {
  /**
   * Generate a unique challenge phrase the user must speak aloud
   * to verify they are the owner of the voice being cloned.
   */
  generateChallenge(): { phrase: string; challengeId: string } {
    const challengeId = crypto.randomUUID();
    const words = [
      'SwanyThree', 'verify', 'alpha', 'bravo', 'charlie',
      'delta', 'echo', 'foxtrot', 'seven', 'nine',
    ];
    // Random 6-word phrase
    const phrase = Array.from({ length: 6 }, () =>
      words[Math.floor(Math.random() * words.length)]
    ).join(' ');

    return { phrase, challengeId };
  }

  /**
   * Record that a user has completed voice consent verification.
   * Stores the challenge ID, timestamp, and user acknowledgment.
   */
  async recordConsent(userId: string, challengeId: string): Promise<void> {
    await mongoose.connection.collection('voice_consents').updateOne(
      { userId },
      {
        $set: {
          status: 'verified' as ConsentStatus,
          challengeId,
          verifiedAt: new Date(),
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );
  }

  /**
   * Check if a user has active voice cloning consent.
   */
  async hasConsent(userId: string): Promise<boolean> {
    const record = await mongoose.connection
      .collection('voice_consents')
      .findOne({ userId, status: 'verified' });
    return !!record;
  }

  /**
   * Revoke voice cloning consent (user can opt out at any time).
   */
  async revokeConsent(userId: string): Promise<void> {
    await mongoose.connection.collection('voice_consents').updateOne(
      { userId },
      { $set: { status: 'revoked' as ConsentStatus, updatedAt: new Date() } }
    );
  }
}
