export const MILLISECONDS_PER_SECOND = 1_000;

export const SECONDS_PER_HOUR = 3_600;

/**
 * Writes an instant as the wall clock of New York, every field in plain digits and midnight as
 * hour 0. Built once: building one for every instant of a sweep takes most of its time.
 */
export const NEW_YORK_WALL_CLOCK = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  hourCycle: 'h23',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
});

/** Friday 17:00 to Sunday 17:00, in seconds since Monday 00:00: the hours FX is taken to be closed in New York. */
export const NEW_YORK_WEEKEND = { start: 406_800, end: 579_600 };
