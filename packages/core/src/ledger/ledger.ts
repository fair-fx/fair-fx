import { z } from 'zod';
import { latestLedgerSchema } from './ledger.schema.ts';
import { LedgerStatus, type LedgerReading } from './ledger.types.ts';

/**
 * Checks what an RPC node returned for `getLatestLedger` and turns it into a reading. Never throws.
 *
 * Expected: an object with a positive integer `sequence` and a `closeTime` of Unix seconds written
 * as a string of digits. Other fields are ignored. Anything else gives `invalid`.
 */
export function toLedgerReading(rawLatestLedger: unknown): LedgerReading {
  const latestLedger = latestLedgerSchema.safeParse(rawLatestLedger);
  if (!latestLedger.success) {
    return { status: LedgerStatus.Invalid, reason: `latest ledger: ${z.prettifyError(latestLedger.error)}` };
  }

  return { status: LedgerStatus.Ok, ...latestLedger.data };
}
