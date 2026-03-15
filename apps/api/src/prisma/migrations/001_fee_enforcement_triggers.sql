-- ─────────────────────────────────────────────────────────────────────────────
-- CY Live — Layer 2: Database Trigger for Fee Enforcement
-- ─────────────────────────────────────────────────────────────────────────────
-- This trigger recomputes platformFee and creatorAmount on EVERY INSERT/UPDATE
-- to the Transaction table. This is the second layer of fee enforcement.
--
-- Layer 1: Service function (TypeScript const platformFeeRate = 0.10)
-- Layer 2: This DB trigger (recomputes on every write)
-- Layer 3: Append-only FeeLedgerEntry (immutable audit trail)
--
-- The fee rate is HARDCODED at 0.10 (10%). NEVER configurable.
-- If you modify this to read from a config table, DELETE YOUR CHANGES.
-- ─────────────────────────────────────────────────────────────────────────────

-- Function: enforce 10% platform fee on every transaction write
CREATE OR REPLACE FUNCTION enforce_platform_fee()
RETURNS TRIGGER AS $$
DECLARE
  computed_fee NUMERIC;
  computed_creator NUMERIC;
BEGIN
  -- HARDCODED: Platform fee is EXACTLY 10%. Creator keeps EXACTLY 90%.
  -- DO NOT make this configurable. DO NOT read from a config table.
  computed_fee := ROUND(NEW."grossAmount" * 0.10, 2);
  computed_creator := ROUND(NEW."grossAmount" * 0.90, 2);

  -- Override whatever values were provided (even from service layer, as additional safety)
  NEW."platformFee" := computed_fee;
  NEW."creatorAmount" := computed_creator;

  -- Log if the values were different (indicates a bug or tampering)
  IF TG_OP = 'INSERT' AND (
    OLD IS NULL OR
    NEW."platformFee" IS DISTINCT FROM computed_fee OR
    NEW."creatorAmount" IS DISTINCT FROM computed_creator
  ) THEN
    RAISE NOTICE 'Fee enforcement trigger corrected values for transaction %: fee=% creator=%',
      NEW.id, computed_fee, computed_creator;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists (idempotent)
DROP TRIGGER IF EXISTS trg_enforce_platform_fee ON "Transaction";

-- Create trigger: fires BEFORE INSERT or UPDATE
CREATE TRIGGER trg_enforce_platform_fee
  BEFORE INSERT OR UPDATE ON "Transaction"
  FOR EACH ROW
  EXECUTE FUNCTION enforce_platform_fee();

-- ─────────────────────────────────────────────────────────────────────────────
-- Verify: Deny any UPDATE or DELETE on FeeLedgerEntry (append-only)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION deny_fee_ledger_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'FeeLedgerEntry is append-only. UPDATE and DELETE are prohibited.';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_deny_fee_ledger_update ON "FeeLedgerEntry";
DROP TRIGGER IF EXISTS trg_deny_fee_ledger_delete ON "FeeLedgerEntry";

CREATE TRIGGER trg_deny_fee_ledger_update
  BEFORE UPDATE ON "FeeLedgerEntry"
  FOR EACH ROW
  EXECUTE FUNCTION deny_fee_ledger_mutation();

CREATE TRIGGER trg_deny_fee_ledger_delete
  BEFORE DELETE ON "FeeLedgerEntry"
  FOR EACH ROW
  EXECUTE FUNCTION deny_fee_ledger_mutation();
