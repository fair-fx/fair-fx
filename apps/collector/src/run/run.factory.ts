import { buildReferenceSet, buildTakenQuote } from '../quotes/quotes.factory.ts';
import { RunClockStatus, type LedgerClock, type RunReadings } from './run.types.ts';

/** Ledger 65,680,158 closing at 2026-11-26 08:56:06 UTC, read by the collector 5 seconds later. */
export function buildLedgerClock(overrides: Partial<LedgerClock> = {}): LedgerClock {
  return {
    status: RunClockStatus.Usable,
    sequence: 65_680_158,
    closeTime: 1_795_683_366,
    skewMilliseconds: -5_000,
    ...overrides,
  };
}

/** A run on a Thursday with a usable clock, a 66 second old EUR price and one quote that paid. */
export function buildRunReadings(overrides: Partial<RunReadings> = {}): RunReadings {
  return {
    startedAt: new Date('2026-11-26T08:56:00.000Z'),
    finishedAt: new Date('2026-11-26T08:56:12.000Z'),
    clock: buildLedgerClock(),
    references: buildReferenceSet(),
    quotes: [buildTakenQuote()],
    ...overrides,
  };
}
