import { z } from 'zod';
import type { DirectAmounts } from './soroswap.types.ts';

/** The value `router_get_amounts_out` returns for a path of two tokens. */
export const directAmountsSchema: z.ZodType<DirectAmounts> = z.tuple([z.bigint(), z.bigint().min(0n)]);
