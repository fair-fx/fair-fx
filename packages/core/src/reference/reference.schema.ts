import { z } from 'zod';
import { REFERENCE_PRICE_DECIMALS } from './reference.constants.ts';
import type { FeedPrice } from './reference.types.ts';

export const feedDecimalsSchema: z.ZodType<number> = z.literal(REFERENCE_PRICE_DECIMALS);

export const feedPriceSchema: z.ZodType<FeedPrice> = z.object({
  price: z.bigint().positive(),
  timestamp: z.bigint().min(0n).max(BigInt(Number.MAX_SAFE_INTEGER)),
});
