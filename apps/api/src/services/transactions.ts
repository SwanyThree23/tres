// ─────────────────────────────────────────────────────────────────────────────
// CY Live — Transaction Processing  |  Layer 1 of Fee Enforcement
// ─────────────────────────────────────────────────────────────────────────────
// LAYER 1: Service function — platformFeeRate is a const, never configurable.
// LAYER 2: DB trigger recomputes fees on INSERT (see migration SQL).
// LAYER 3: Append-only FeeLedgerEntry — immutable audit trail.
//
// If you write code that makes the fee adjustable, DELETE IT.
// ─────────────────────────────────────────────────────────────────────────────

import { Prisma, TxType, TxStatus } from '@prisma/client';
import prisma from '../lib/prisma.js';
import logger from '../lib/logger.js';

// ─────────────────────────────────────────────────────────────────────────────
// IMMUTABLE — PLATFORM FEE IS 10% — CREATOR KEEPS 90%
// ─────────────────────────────────────────────────────────────────────────────
const platformFeeRate = 0.10;
// ─────────────────────────────────────────────────────────────────────────────
// If you make this configurable, you are violating the system contract.
// ─────────────────────────────────────────────────────────────────────────────

export interface ProcessTransactionOpts {
  grossAmount: number;           // In dollars (e.g., 10.00)
  toUserId: string;              // Creator
  type: TxType;
  idempotencyKey: string;
  fromUserId: string;            // Payer
  stageId?: string;
  stripePaymentIntentId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Process a transaction with immutable 90/10 fee split.
 *
 * Fee computation is done HERE (Layer 1), revalidated by DB trigger (Layer 2),
 * and recorded in the append-only FeeLedgerEntry (Layer 3).
 */
export async function processTransaction(opts: ProcessTransactionOpts) {
  // ── Layer 1: Service-level fee enforcement ────────────────────────────────
  const platformFee = Math.round(opts.grossAmount * platformFeeRate * 100) / 100;
  const creatorAmount = Math.round(opts.grossAmount * 0.90 * 100) / 100;

  // Sanity check: fee + creator must equal gross
  const sum = Math.round((platformFee + creatorAmount) * 100) / 100;
  if (sum !== opts.grossAmount) {
    logger.error(
      { grossAmount: opts.grossAmount, platformFee, creatorAmount, sum },
      'Fee split sanity check FAILED — aborting transaction',
    );
    throw new Error('Fee split computation error');
  }

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Create transaction record
    const transaction = await tx.transaction.create({
      data: {
        type: opts.type,
        status: TxStatus.COMPLETED,
        grossAmount: opts.grossAmount,
        platformFee,          // Computed HERE — DB trigger recomputes anyway
        creatorAmount,        // Computed HERE — DB trigger recomputes anyway
        currency: 'USD',
        idempotencyKey: opts.idempotencyKey,
        fromUserId: opts.fromUserId,
        toUserId: opts.toUserId,
        stageId: opts.stageId ?? null,
        stripePaymentIntentId: opts.stripePaymentIntentId ?? null,
        metadata: (opts.metadata as Prisma.InputJsonValue) ?? undefined,
      },
    });

    // ── Layer 3: Append-only fee ledger ───────────────────────────────────
    // This is INSERT-only. Never updated. Never deleted.
    const expectedPlatformFee = Math.round(opts.grossAmount * 0.10 * 100) / 100;
    const expectedCreatorAmount = Math.round(opts.grossAmount * 0.90 * 100) / 100;

    await tx.feeLedgerEntry.create({
      data: {
        transactionId: transaction.id,
        grossAmount: opts.grossAmount,
        platformFee: expectedPlatformFee,
        creatorAmount: expectedCreatorAmount,
        feeRate: 0.10,
        currency: 'USD',
        creatorId: opts.toUserId,
        verifiedCorrect:
          platformFee === expectedPlatformFee &&
          creatorAmount === expectedCreatorAmount,
      },
    });

    logger.info(
      {
        txId: transaction.id,
        type: opts.type,
        gross: opts.grossAmount,
        fee: platformFee,
        creator: creatorAmount,
        verified: platformFee === expectedPlatformFee,
      },
      'Transaction processed with fee enforcement',
    );

    return transaction;
  });

  return result;
}

/**
 * Mark a transaction as pending (used for failed payment intents)
 */
export async function markTransactionPending(stripePaymentIntentId: string) {
  await prisma.transaction.updateMany({
    where: { stripePaymentIntentId },
    data: { status: TxStatus.PENDING },
  });
}

/**
 * Mark a transaction as failed
 */
export async function markTransactionFailed(stripePaymentIntentId: string) {
  await prisma.transaction.updateMany({
    where: { stripePaymentIntentId },
    data: { status: TxStatus.FAILED },
  });
}

/**
 * Verify fee integrity for a transaction
 */
export function verifyFee(grossAmount: number, recordedFee: number): boolean {
  const expected = Math.round(grossAmount * 0.10 * 100) / 100;
  return recordedFee === expected;
}
