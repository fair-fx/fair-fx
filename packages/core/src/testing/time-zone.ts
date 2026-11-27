import { MILLISECONDS_PER_SECOND } from './time-zone.constants.ts';

/**
 * Seconds to add to `unixSeconds` to get the wall clock `wallClock` writes at that instant: -18000
 * for New York on standard time, -14400 on daylight time. The rules come from the time zone data of
 * the runtime.
 */
export function utcOffsetSeconds(wallClock: Intl.DateTimeFormat, unixSeconds: number): number {
  const parts = wallClock.formatToParts(new Date(unixSeconds * MILLISECONDS_PER_SECOND));
  const clock = new Map(parts.map((part) => [part.type, Number(part.value)]));
  const wallClockAsUtc = Date.UTC(
    clock.get('year') ?? NaN,
    (clock.get('month') ?? NaN) - 1,
    clock.get('day'),
    clock.get('hour'),
    clock.get('minute'),
    clock.get('second'),
  );

  return wallClockAsUtc / MILLISECONDS_PER_SECOND - unixSeconds;
}
