import { errorMessageWithCause, LedgerStatus, toLedgerReading, type LedgerReading, type LedgerSource } from '../../index.ts';

/**
 * Reads the latest ledger `source` knows: its sequence and when it closed. Never throws: a node that
 * cannot be reached, or a call that fails, gives `unavailable` with the reason.
 */
export async function readLatestLedger(source: LedgerSource): Promise<LedgerReading> {
  try {
    return toLedgerReading(await source.latestLedger());
  } catch (error) {
    return { status: LedgerStatus.Unavailable, reason: errorMessageWithCause(error) };
  }
}
