import type { LedgerFailure } from '@fair-fx/core';
import type { ReferenceSet, TakenQuote } from '../quotes/index.ts';

/** Whether a run has a clock to date its reference prices by. */
export enum RunClockStatus {
  /** The latest ledger was read, and its close time agrees with the collector's clock. */
  Usable = 'usable',
  /** The latest ledger was read, and its close time is too far from the collector's clock. */
  Skewed = 'skewed',
  /** The latest ledger could not be read. */
  Unreadable = 'unreadable',
}

/** The latest ledger as a clock: prices are dated by its close time, not by the collector's clock. */
export interface LedgerClock {
  readonly status: RunClockStatus.Usable | RunClockStatus.Skewed;
  readonly sequence: number;
  /** Unix seconds. */
  readonly closeTime: number;
  /**
   * The close time minus the collector's clock when the ledger was read. Negative when the ledger
   * closed before that moment, which is the usual case.
   */
  readonly skewMilliseconds: number;
}

export interface UnreadableClock {
  readonly status: RunClockStatus.Unreadable;
  readonly failure: LedgerFailure;
}

export type RunClock = LedgerClock | UnreadableClock;

/** Everything one run read, before it is judged and stored. */
export interface RunReadings {
  readonly startedAt: Date;
  readonly finishedAt: Date;
  readonly clock: RunClock;
  readonly references: ReferenceSet;
  readonly quotes: readonly TakenQuote[];
}
