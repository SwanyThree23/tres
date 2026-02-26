/**
 * SwanyThree 90/10 Revenue Split Engine
 * Hardcoded platform fee: 10% to platform, 90% to creator.
 *
 * COMPLIANCE FIX: Only Stripe Connect transactions trigger the 90/10 split.
 * Direct tips (CashApp/Zelle/Venmo) are P2P and NOT gated to content access.
 * Tax compliance: Stripe Connect handles 1099-K reporting for platform transactions.
 */

import mongoose from 'mongoose';

export interface TransactionResult {
  creatorNet: number;
  platformFee: number;
  feeDisclosure: string;
}

/**
 * Platform fee is applied ONLY to Stripe-processed transactions.
 * P2P tips (CashApp, Zelle, Venmo) are fee-free and do not gate content.
 */
const PLATFORM_FEE_PERCENT = 0.10;

type PlatformPaymentMethod = 'stripe';
type DirectTipMethod = 'cashapp' | 'zelle' | 'venmo' | 'paypal';
type PaymentMethod = PlatformPaymentMethod | DirectTipMethod;

const DIRECT_TIP_METHODS: DirectTipMethod[] = ['cashapp', 'zelle', 'venmo', 'paypal'];

/**
 * Process a platform transaction with the hardcoded 90/10 split.
 * Only 'stripe' method applies the platform fee and gates content.
 *
 * @param amountCents - Gross amount in cents
 * @param creatorId - Creator's user ID
 * @param source - Payment method identifier
 */
export async function processTransaction(
  amountCents: number,
  creatorId: string,
  source: PaymentMethod | string
): Promise<TransactionResult> {
  const isDirect = DIRECT_TIP_METHODS.includes(source as DirectTipMethod);

  // Direct tips: no platform fee, no content gating
  const platformFee = isDirect ? 0 : Math.floor(amountCents * PLATFORM_FEE_PERCENT);
  const creatorNet = amountCents - platformFee;

  const feeDisclosure = isDirect
    ? 'Direct tip: 0% platform fee. You are responsible for reporting this income for tax purposes.'
    : `Platform transaction: 10% service fee applied ($${(platformFee / 100).toFixed(2)}). Tax reporting handled via Stripe Connect (1099-K).`;

  await mongoose.connection.collection('transactions').insertOne({
    creatorId,
    grossAmount: amountCents,
    platformFee,
    creatorNet,
    source,
    isDirect,
    feeDisclosure,
    timestamp: new Date(),
  });

  // Atomic increment of creator wallet balance (platform transactions only)
  if (!isDirect) {
    await mongoose.connection.collection('users').updateOne(
      { _id: new mongoose.Types.ObjectId(creatorId) },
      { $inc: { balance: creatorNet } }
    );
  }

  return { creatorNet, platformFee, feeDisclosure };
}

/**
 * Returns the fee disclosure text for display in the UI.
 * COMPLIANCE: Eliminates false advertising by clearly stating fees.
 */
export function getFeeDisclosure(): {
  platformTransactions: string;
  directTips: string;
} {
  return {
    platformTransactions: 'Platform features (Paywalls, Subscriptions) carry a 10% service fee. Tax reporting is handled via Stripe Connect.',
    directTips: 'Direct tips (CashApp, Zelle, Venmo) are fee-free and go directly to the creator. Creators are solely responsible for reporting tip income.',
  };
}
