import { referenceAgeSeconds, ReferenceStatus, type ReferenceReading } from '@fair-fx/core';
import type { ReferenceLog } from './log.types.ts';

/** `reading` as plain JSON, aged by `closeTime` in Unix seconds when the run has one. */
export function referenceLog(reading: ReferenceReading, closeTime: number | null): ReferenceLog {
  const { fiat, status } = reading;
  switch (reading.status) {
    case ReferenceStatus.Ok:
      return {
        fiat,
        status,
        oracleTime: reading.oracleTime,
        ageSeconds: closeTime === null ? null : referenceAgeSeconds(reading, closeTime),
      };
    case ReferenceStatus.Missing:
      return { fiat, status };
    case ReferenceStatus.Invalid:
    case ReferenceStatus.Unavailable:
      return { fiat, status, reason: reading.reason };
  }
}
