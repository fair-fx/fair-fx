import type { RunReport } from '../collect/index.ts';
import { RunClockStatus } from '../run/index.ts';
import { LogEvent, type RunLogLine } from './log.types.ts';
import { quoteTally } from './quote-tally.ts';
import { referenceLog } from './reference-log.ts';

/** The line a run logs when its store has answered. */
export function runLogLine({ readings, run, outcome }: RunReport): RunLogLine {
  const { clock } = readings;
  const closeTime = clock.status === RunClockStatus.Unreadable ? null : clock.closeTime;

  return {
    event: LogEvent.Run,
    slot: run.slot.toISOString(),
    startedAt: run.startedAt.toISOString(),
    finishedAt: run.finishedAt.toISOString(),
    outcome,
    referenceState: run.referenceState,
    clock,
    references: readings.references.readings.map((reading) => referenceLog(reading, closeTime)),
    quotes: quoteTally(run.quotes),
    shortfalls: run.quotes.filter((sample) => 'shortfall' in sample && sample.shortfall !== null).length,
  };
}
