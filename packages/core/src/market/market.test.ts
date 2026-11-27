import { DEFAULT_MARKET_HOURS, isMarketClosed } from '@fair-fx/core';
import { hoursOpenInNewYorkWeekend, WEEKEND_WINDOW } from '@fair-fx/core/testing';

// Seconds since Monday 00:00 UTC: Sunday 20:00 to Monday 02:00, a window that runs over the end of the week.
const SUNDAY_NIGHT_WINDOW = { start: 590_400, end: 7_200 };

// Unix seconds, 00:00:00 UTC on 1 January.
const START_OF_2026 = 1_767_225_600;
const START_OF_2027 = 1_798_761_600;
const START_OF_2029 = 1_861_920_000;

describe('DEFAULT_MARKET_HOURS', () => {
  it.each([
    { what: 'Friday 2026-11-27 20:59:59', now: 1_795_813_199, closed: false },
    { what: 'Friday 2026-11-27 21:00:00', now: 1_795_813_200, closed: true },
    { what: 'Sunday 2026-11-29 21:59:59', now: 1_795_989_599, closed: true },
    { what: 'Sunday 2026-11-29 22:00:00', now: 1_795_989_600, closed: false },
  ])('gives closed as $closed at $what UTC', ({ now, closed }) => {
    const isClosed = isMarketClosed(DEFAULT_MARKET_HOURS.closedWindow, now);

    expect(isClosed).toBe(closed);
  });

  it('is closed for the whole New York weekend, on standard and on daylight time', () => {
    const openHours = hoursOpenInNewYorkWeekend(DEFAULT_MARKET_HOURS.closedWindow, START_OF_2026, START_OF_2029);

    expect(openHours).toEqual([]);
  });
});

describe('hoursOpenInNewYorkWeekend', () => {
  it.each([
    {
      what: 'the Fridays on daylight time, 2026-03-13 to 2026-10-30, for a window that closes at 22:00 UTC',
      closedWindow: WEEKEND_WINDOW,
      count: 34,
      first: 1_773_435_600,
      last: 1_793_394_000,
    },
    {
      what: 'the Sundays on standard time, 2026-01-04 to 2026-12-27, for a window that opens at 21:00 UTC',
      closedWindow: { start: 421_200, end: 594_000 },
      count: 18,
      first: 1_767_560_400,
      last: 1_798_405_200,
    },
  ])('finds the hour at 21:00 UTC on $what', ({ closedWindow, count, first, last }) => {
    const openHours = hoursOpenInNewYorkWeekend(closedWindow, START_OF_2026, START_OF_2027);

    expect(openHours).toHaveLength(count);
    expect(openHours[0]).toBe(first);
    expect(openHours.at(-1)).toBe(last);
  });
});

describe('isMarketClosed', () => {
  it.each([
    { what: 'Wednesday 2026-11-25 12:00:00', now: 1_795_608_000, closed: false },
    { what: 'Friday 2026-11-27 21:59:59', now: 1_795_816_799, closed: false },
    { what: 'Friday 2026-11-27 22:00:00, the first closed second', now: 1_795_816_800, closed: true },
    { what: 'Saturday 2026-11-28 12:00:00', now: 1_795_867_200, closed: true },
    { what: 'Sunday 2026-11-29 21:59:59, the last closed second', now: 1_795_989_599, closed: true },
    { what: 'Sunday 2026-11-29 22:00:00', now: 1_795_989_600, closed: false },
  ])('gives $closed at $what UTC, for Friday 22:00 to Sunday 22:00', ({ now, closed }) => {
    const isClosed = isMarketClosed(WEEKEND_WINDOW, now);

    expect(isClosed).toBe(closed);
  });

  it.each([
    { what: 'Sunday 2026-11-29 19:59:59', now: 1_795_982_399, closed: false },
    { what: 'Sunday 2026-11-29 20:00:00', now: 1_795_982_400, closed: true },
    { what: 'Monday 2026-11-30 01:59:59', now: 1_796_003_999, closed: true },
    { what: 'Monday 2026-11-30 02:00:00', now: 1_796_004_000, closed: false },
  ])('gives $closed at $what UTC, for a window that runs over the end of the week', ({ now, closed }) => {
    const isClosed = isMarketClosed(SUNDAY_NIGHT_WINDOW, now);

    expect(isClosed).toBe(closed);
  });

  it('is never closed without a window', () => {
    const SATURDAY_NOON = 1_795_867_200;

    const isClosed = isMarketClosed(null, SATURDAY_NOON);

    expect(isClosed).toBe(false);
  });
});
