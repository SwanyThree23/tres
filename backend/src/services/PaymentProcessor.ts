/**
 * SwanyThree 90/10 Revenue Split Engine
 * Hardcoded platform fee: 10% to platform, 90% to creator.
 */

import mongoose from 'mongoose';

export interface TransactionResult {
  creatorNet: number;
  platformFee: number;
}

const PLATFORM_FEE_PERCENT = 0.10;

/**
 * Process a transaction with the hardcoded 90/10 split.
 * @param amountCents - Gross amount in cents
 * @param creatorId - Creator's user ID
 * @param source - Payment source ('stripe', 'paypal', 'cashapp')
 */
export async function processTransaction(
  amountCents: number,
  creatorId: string,
  source: string
): Promise<TransactionResult> {
  const platformFee = Math.floor(amountCents * PLATFORM_FEE_PERCENT);
  const creatorNet = amountCents - platformFee;

  await mongoose.connection.collection('transactions').insertOne({
    creatorId,
    grossAmount: amountCents,
    platformFee,
    creatorNet,
    source,
    timestamp: new Date(),
  });

  // Atomic increment of creator wallet balance
  await mongoose.connection.collection('users').updateOne(
    { _id: new mongoose.Types.ObjectId(creatorId) },
    { $inc: { balance: creatorNet } }
  );

  return { creatorNet, platformFee };
}
