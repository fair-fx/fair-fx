import { referenceState, ReferenceState, type WeeklyWindow } from '@fair-fx/core';
import type { FinishedRun } from '@fair-fx/db/writes';
import { toQuoteSample } from '../quotes/index.ts';
import { toReferenceSamples } from './reference-samples.ts';
import { RunClockStatus, type RunReadings } from './run.types.ts';
import { slotOf } from './slot.ts';

/**
 * The run to store for what was read. The reference prices are judged by the close time of the
 * latest ledger. Without a usable clock the reference state is `unknown`, and in an `unknown` run
 * no quote has a shortfall. Every read is stored either way.
 */
export function finishRun(readings: RunReadings, closedWindow: WeeklyWindow | null): FinishedRun {
  const { clock, references } = readings;
  const state =
    clock.status === RunClockStatus.Usable
      ? referenceState(references.readings, closedWindow, clock.closeTime)
      : ReferenceState.Unknown;
  const comparable = state === ReferenceState.Unknown ? null : references;

  return {
    slot: slotOf(readings.startedAt),
    startedAt: readings.startedAt,
    finishedAt: readings.finishedAt,
    ledger: clock.status === RunClockStatus.Unreadable ? null : clock.sequence,
    referenceState: state,
    references: toReferenceSamples(references),
    quotes: readings.quotes.map((taken) => toQuoteSample(taken, comparable)),
  };
}
