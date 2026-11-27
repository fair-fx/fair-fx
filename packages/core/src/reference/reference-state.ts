import { isMarketClosed, type WeeklyWindow } from '../market/index.ts';
import { MAX_REFERENCE_AGE_SECONDS } from './reference.constants.ts';
import { referenceAgeSeconds } from './reference.ts';
import { ReferenceState, ReferenceStatus, type ReferenceReading } from './reference.types.ts';

/**
 * What a run can say about its reference at `nowSeconds` (Unix seconds), from every reading it made.
 *
 * `unknown` comes first, at any hour: a reading gave no price, a price is older than 10 minutes or
 * dated after `nowSeconds`, or there is no reading. Only then do the hours count: `closed` inside
 * `closedWindow`, `fresh` outside.
 */
export function referenceState(
  readings: readonly ReferenceReading[],
  closedWindow: WeeklyWindow | null,
  nowSeconds: number,
): ReferenceState {
  const usable = readings.every((reading) => {
    if (reading.status !== ReferenceStatus.Ok) {
      return false;
    }

    const ageSeconds = referenceAgeSeconds(reading, nowSeconds) ?? 0;

    return ageSeconds >= 0 && ageSeconds <= MAX_REFERENCE_AGE_SECONDS;
  });
  if (readings.length === 0 || !usable) {
    return ReferenceState.Unknown;
  }

  return isMarketClosed(closedWindow, nowSeconds) ? ReferenceState.Closed : ReferenceState.Fresh;
}
