import { ReferenceStatus } from '@fair-fx/core';
import type { ReferenceSample } from '@fair-fx/db/writes';
import type { ReferenceSet } from '../quotes/index.ts';

/**
 * The samples a run stores for its reference reads: one per read, whether or not it gave a price.
 * The feed's base currency is left out: its price is a constant and has no oracle time.
 */
export function toReferenceSamples({ source, readings }: ReferenceSet): ReferenceSample[] {
  return readings.flatMap((reading): ReferenceSample[] => {
    if (reading.status !== ReferenceStatus.Ok) {
      return [{ source, reading }];
    }

    const { oracleTime } = reading;

    return oracleTime === null ? [] : [{ source, reading: { ...reading, oracleTime } }];
  });
}
