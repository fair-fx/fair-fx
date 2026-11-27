import { isMarketClosed, type WeeklyWindow } from '../market/index.ts';
import { NEW_YORK_WALL_CLOCK, NEW_YORK_WEEKEND, SECONDS_PER_HOUR } from './time-zone.constants.ts';
import { utcOffsetSeconds } from './time-zone.ts';

/**
 * Every whole hour from `fromSeconds` up to `toSeconds` (Unix seconds) at which `closedWindow` says
 * open while the clock in New York is between Friday 17:00 and Sunday 17:00. Empty when the window
 * covers the New York weekend on both standard and daylight time. It steps by one hour, so it is
 * exact only for a window whose edges are on the hour.
 */
export function hoursOpenInNewYorkWeekend(
  closedWindow: WeeklyWindow | null,
  fromSeconds: number,
  toSeconds: number,
): number[] {
  const hours: number[] = [];
  for (let now = fromSeconds; now < toSeconds; now += SECONDS_PER_HOUR) {
    const newYorkClock = now + utcOffsetSeconds(NEW_YORK_WALL_CLOCK, now);
    if (isMarketClosed(NEW_YORK_WEEKEND, newYorkClock) && !isMarketClosed(closedWindow, now)) {
      hours.push(now);
    }
  }

  return hours;
}
