import type { Fiat, ReferenceState, ReferenceStatus, VenueId } from '@fair-fx/core';
import type { WriteRunOutcome } from '@fair-fx/db/writes';
import type { RunClock } from '../run/index.ts';

/** What a log line reports. */
export enum LogEvent {
  /** A run finished and its store answered. */
  Run = 'run',
  /** A run stopped before it was stored: bad settings, or the store failed. */
  RunFailed = 'run_failed',
  /** An idle connection of the database pool broke. */
  DatabaseError = 'database_error',
}

/** One reference read, as plain JSON. The age is in seconds by the close time of the latest ledger. */
export interface ReferenceLog {
  readonly fiat: Fiat;
  readonly status: ReferenceStatus;
  /** Unix seconds. `null` for the feed's base currency, absent when the read gave no price. */
  readonly oracleTime?: number | null;
  /** `null` when the run has no ledger close time, or for the feed's base currency. */
  readonly ageSeconds?: number | null;
  readonly reason?: string;
}

/** Per venue, how many quotes ended which way: `ok`, or a status and its cause like `error:timeout`. */
export type QuoteTally = Readonly<Partial<Record<VenueId, Readonly<Record<string, number>>>>>;

/**
 * The line a run logs, holding what the database does not: the close time of the ledger, how far it
 * was from the collector's clock, and the age of each price. With these, the reference state the run
 * stored can be checked again later.
 */
export interface RunLogLine {
  readonly event: LogEvent.Run;
  readonly slot: string;
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly outcome: WriteRunOutcome;
  readonly referenceState: ReferenceState;
  readonly clock: RunClock;
  readonly references: readonly ReferenceLog[];
  readonly quotes: QuoteTally;
  /** How many quotes have a shortfall stored. */
  readonly shortfalls: number;
}

export interface FailureLogLine {
  readonly event: LogEvent.RunFailed | LogEvent.DatabaseError;
  readonly reason: string;
}

export type LogLine = RunLogLine | FailureLogLine;
