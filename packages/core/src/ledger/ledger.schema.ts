import { z } from 'zod';
import type { LatestLedger } from './ledger.types.ts';

/** The two fields of a `getLatestLedger` answer a reading keeps. The node sends `closeTime` as a string. */
export const latestLedgerSchema: z.ZodType<Omit<LatestLedger, 'status'>> = z.object({
  sequence: z.int().positive(),
  closeTime: z
    .string()
    .regex(/^[0-9]+$/, 'expected Unix seconds as a string of digits')
    .transform(Number)
    .pipe(z.int('expected Unix seconds that fit a safe integer').positive()),
});
