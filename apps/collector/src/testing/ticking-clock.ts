/** A clock that reads `start` first, then `stepMilliseconds` later each time it is read again. */
export function tickingClock(start: string, stepMilliseconds = 1_000): () => Date {
  let reads = 0;

  return () => new Date(Date.parse(start) + stepMilliseconds * reads++);
}
