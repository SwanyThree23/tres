/**
 * Creator Identity Verification Service
 * Requires Stripe Identity verification for creators hosting private/paid panels.
 *
 * Risk mitigated: CSAM, trafficking, and illegal content in private panels.
 * Creators must verify their real identity before monetizing or hosting private streams.
 */

import axios from 'axios';
import mongoose from 'mongoose';

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

interface VerificationRecord {
  userId: string;
  status: VerificationStatus;
  stripeVerificationId?: string;
  verifiedAt?: Date;
  rejectedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CreatorVerification {
  private stripeSecretKey: string;

  constructor() {
    this.stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
  }

  /**
   * Create a Stripe Identity verification session for a creator.
   * Returns a client_secret the frontend uses to launch the verification UI.
   */
  async createVerificationSession(userId: string): Promise<{ clientSecret: string; sessionId: string }> {
    const response = await axios.post(
      'https://api.stripe.com/v1/identity/verification_sessions',
      new URLSearchParams({
        type: 'document',
        'metadata[userId]': userId,
        'options[document][require_matching_selfie]': 'true',
      }),
      {
        headers: {
          Authorization: `Bearer ${this.stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    await mongoose.connection.collection('verifications').updateOne(
      { userId },
      {
        $set: {
          status: 'pending',
          stripeVerificationId: response.data.id,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    return {
      clientSecret: response.data.client_secret,
      sessionId: response.data.id,
    };
  }

  /**
   * Check current verification status for a creator.
   */
  async getStatus(userId: string): Promise<VerificationStatus> {
    const record = await mongoose.connection.collection('verifications').findOne({ userId }) as VerificationRecord | null;
    return record?.status || 'unverified';
  }

  /**
   * Handle Stripe Identity webhook to update verification status.
   */
  async handleWebhook(event: { type: string; data: { object: { id: string; status: string; metadata: { userId: string } } } }) {
    const session = event.data.object;
    const userId = session.metadata.userId;

    let status: VerificationStatus = 'pending';
    if (event.type === 'identity.verification_session.verified') {
      status = 'verified';
    } else if (event.type === 'identity.verification_session.requires_input') {
      status = 'rejected';
    }

    await mongoose.connection.collection('verifications').updateOne(
      { userId },
      {
        $set: {
          status,
          verifiedAt: status === 'verified' ? new Date() : undefined,
          updatedAt: new Date(),
        },
      }
    );
  }

  /**
   * Enforce verification gate: returns true only if creator is verified.
   * Used to guard private panels and paid content.
   */
  async requireVerified(userId: string): Promise<boolean> {
    const status = await this.getStatus(userId);
    return status === 'verified';
  }
}
