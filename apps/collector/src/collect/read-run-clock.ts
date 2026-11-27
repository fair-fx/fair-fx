import { LedgerStatus, type LedgerSource } from '@fair-fx/core';
import { readLatestLedger } from '@fair-fx/core/stellar';
import { toRunClock, type RunClock } from '../run/index.ts';

/**
 * The clock of a run, from the latest ledger of `source`. A read that is `unavailable` is tried once
 * more, at once; an `invalid` answer is not, since asking again is not expected to change it. The
 * collector's clock is read when the answer that is used arrives.
 */
export async function readRunClock(source: LedgerSource, now: () => Date): Promise<RunClock> {
  const first = await readLatestLedger(source);
  const ledger = first.status === LedgerStatus.Unavailable ? await readLatestLedger(source) : first;

  return toRunClock(ledger, now());
}
