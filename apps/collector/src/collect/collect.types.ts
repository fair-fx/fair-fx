import type {
  LedgerSource,
  Pair,
  ReferenceFeed,
  ReferenceSource,
  VenueAdapter,
  WeeklyWindow,
} from '@fair-fx/core';
import type { FinishedRun, WriteRunOutcome } from '@fair-fx/db/writes';
import type { RunReadings } from '../run/index.ts';

/** What a run reads from and writes to. Tests pass fakes, `main.ts` passes the live ones. */
export interface CollectorPorts {
  readonly venues: readonly VenueAdapter[];
  readonly feed: ReferenceFeed;
  readonly ledger: LedgerSource;
  /** The collector's own clock. */
  readonly now: () => Date;
  readonly store: (run: FinishedRun) => Promise<WriteRunOutcome>;
}

/** What a run asks for. */
export interface CollectorPlan {
  readonly pairs: readonly Pair[];
  /** In whole units of the input token. */
  readonly ladder: readonly bigint[];
  readonly referenceSource: ReferenceSource;
  /** The weekly hours the market is taken to be closed, or `null` for none. */
  readonly closedWindow: WeeklyWindow | null;
}

/** What one run read, the run it stored, and how the store went. */
export interface RunReport {
  readonly readings: RunReadings;
  readonly run: FinishedRun;
  readonly outcome: WriteRunOutcome;
}
