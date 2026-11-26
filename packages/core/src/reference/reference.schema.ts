import { z } from 'zod';
import type { FeedPrice } from './reference.types.ts';

/** Decimals of every price of the Reflector fiat feed. The contract refuses a feed with any other. */
export const REFERENCE_PRICE_DECIMALS = 14;

export const feedDecimalsSchema: z.ZodType<number> = z.literal(REFERENCE_PRICE_DECIMALS);

export const feedPriceSchema: z.ZodType<FeedPrice> = z.object({
  price: z.bigint().positive(),
  timestamp: z.bigint().min(0n).max(BigInt(Number.MAX_SAFE_INTEGER)),
});
