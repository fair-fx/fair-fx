import { toRunClock } from '@fair-fx/collector';
import { LedgerStatus, type LatestLedger, type LedgerFailure } from '@fair-fx/core';

/** Mainnet ledger 65,693,709, which closed at 2026-11-27 04:43:36 UTC. */
const LEDGER: LatestLedger = { status: LedgerStatus.Ok, sequence: 65_693_709, closeTime: 1_795_754_616 };

describe('toRunClock', () => {
  it('is usable with the sequence, close time and skew of a ledger read 5 seconds after it closed', () => {
    const readAt = new Date('2026-11-27T04:43:41.000Z');

    const clock = toRunClock(LEDGER, readAt);

    expect(clock).toEqual({
      status: 'usable',
      sequence: 65_693_709,
      closeTime: 1_795_754_616,
      skewMilliseconds: -5_000,
    });
  });

  it.each([
    { what: '30 s before', readAt: '2026-11-27T04:44:06.000Z', status: 'usable', skewMilliseconds: -30_000 },
    { what: '30 s after', readAt: '2026-11-27T04:43:06.000Z', status: 'usable', skewMilliseconds: 30_000 },
    { what: '30.001 s before', readAt: '2026-11-27T04:44:06.001Z', status: 'skewed', skewMilliseconds: -30_001 },
    { what: '30.001 s after', readAt: '2026-11-27T04:43:05.999Z', status: 'skewed', skewMilliseconds: 30_001 },
  ])('is $status for a ledger that closed $what the collector read it', ({ readAt, status, skewMilliseconds }) => {
    const collectorClock = new Date(readAt);

    const clock = toRunClock(LEDGER, collectorClock);

    expect(clock).toEqual({ status, sequence: 65_693_709, closeTime: 1_795_754_616, skewMilliseconds });
  });

  it.each<LedgerFailure>([
    { status: LedgerStatus.Unavailable, reason: 'fetch failed' },
    { status: LedgerStatus.Invalid, reason: 'latest ledger: closeTime: expected Unix seconds as a string of digits' },
  ])('is unreadable with the failure of a ledger read that was $status', (failure) => {
    const readAt = new Date('2026-11-27T04:43:41.000Z');

    const clock = toRunClock(failure, readAt);

    expect(clock).toEqual({ status: 'unreadable', failure });
  });
});
