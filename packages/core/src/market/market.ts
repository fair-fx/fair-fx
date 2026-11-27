import { SECONDS_PER_WEEK, UNIX_EPOCH_SECONDS_AFTER_MONDAY } from './market.constants.ts';
import type { WeeklyWindow } from './market.types.ts';

/** Whether `nowSeconds` (Unix seconds) falls inside the weekly `closedWindow`. Never, when there is none. */
export function isMarketClosed(closedWindow: WeeklyWindow | null, nowSeconds: number): boolean {
  if (closedWindow === null) {
    return false;
  }

  const { start, end } = closedWindow;
  const secondOfWeek = (nowSeconds + UNIX_EPOCH_SECONDS_AFTER_MONDAY) % SECONDS_PER_WEEK;

  return start < end ? start <= secondOfWeek && secondOfWeek < end : secondOfWeek >= start || secondOfWeek < end;
}
