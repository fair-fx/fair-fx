import { SLOT_MILLISECONDS } from './run.constants.ts';

/** Start of the 5 minute slot `instant` falls in. */
export function slotOf(instant: Date): Date {
  const time = instant.getTime();

  return new Date(time - (time % SLOT_MILLISECONDS));
}
