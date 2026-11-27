import { LedgerStatus, type LedgerReading } from '@fair-fx/core';
import { MAX_CLOCK_SKEW_SECONDS, MILLISECONDS_PER_SECOND } from './run.constants.ts';
import { RunClockStatus, type RunClock } from './run.types.ts';

/**
 * The clock of a run, from a read of the latest ledger. `readAt` is the collector's clock when the
 * answer arrived. A ledger whose close time is more than `MAX_CLOCK_SKEW_SECONDS` from it, before
 * or after, is `skewed`.
 */
export function toRunClock(ledger: LedgerReading, readAt: Date): RunClock {
  if (ledger.status !== LedgerStatus.Ok) {
    return { status: RunClockStatus.Unreadable, failure: ledger };
  }

  const skewMilliseconds = ledger.closeTime * MILLISECONDS_PER_SECOND - readAt.getTime();
  const agrees = Math.abs(skewMilliseconds) <= MAX_CLOCK_SKEW_SECONDS * MILLISECONDS_PER_SECOND;

  return {
    status: agrees ? RunClockStatus.Usable : RunClockStatus.Skewed,
    sequence: ledger.sequence,
    closeTime: ledger.closeTime,
    skewMilliseconds,
  };
}
