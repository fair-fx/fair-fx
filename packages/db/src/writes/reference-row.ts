import { ReferenceStatus } from '@fair-fx/core';
import type { ReferenceSample } from './run.types.ts';
import type { ReferenceRow } from './sample-row.types.ts';
import { MILLISECONDS_PER_SECOND } from './time.constants.ts';

/** The row a reference sample is stored as. A read that gave no price keeps its status and its reason. */
export function toReferenceRow({ source, reading }: ReferenceSample): ReferenceRow {
  const row = { source, symbol: reading.fiat, status: reading.status };

  switch (reading.status) {
    case ReferenceStatus.Ok:
      return {
        ...row,
        price: reading.price.toString(),
        decimals: reading.decimals,
        oracle_time: new Date(reading.oracleTime * MILLISECONDS_PER_SECOND).toISOString(),
        reason: null,
      };
    case ReferenceStatus.Missing:
      return { ...row, price: null, decimals: null, oracle_time: null, reason: null };
    case ReferenceStatus.Invalid:
    case ReferenceStatus.Unavailable:
      return { ...row, price: null, decimals: null, oracle_time: null, reason: reading.reason };
  }
}
