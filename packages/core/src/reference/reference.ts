import { z } from 'zod';
import { Fiat } from '../asset/index.ts';
import { feedDecimalsSchema, feedPriceSchema, REFERENCE_PRICE_DECIMALS } from './reference.schema.ts';
import { ReferenceStatus, type ReferencePrice, type ReferenceReading } from './reference.types.ts';

/** The feed prices every currency in USD, so it has no entry for USD itself. */
export const REFERENCE_BASE = Fiat.Usd;

export function baseReference(): ReferencePrice {
  return {
    status: ReferenceStatus.Ok,
    fiat: REFERENCE_BASE,
    price: 10n ** BigInt(REFERENCE_PRICE_DECIMALS),
    decimals: REFERENCE_PRICE_DECIMALS,
    oracleTime: null,
  };
}

/** Turns what the feed returned for `decimals()` and `lastprice(fiat)` into a reading. Never throws. */
export function toReferenceReading(fiat: Fiat, feedDecimals: unknown, lastPrice: unknown): ReferenceReading {
  const decimals = feedDecimalsSchema.safeParse(feedDecimals);
  if (!decimals.success) {
    return { status: ReferenceStatus.Invalid, fiat, reason: `feed decimals: ${z.prettifyError(decimals.error)}` };
  }

  if (lastPrice === null) {
    return { status: ReferenceStatus.Missing, fiat };
  }

  const feedPrice = feedPriceSchema.safeParse(lastPrice);
  if (!feedPrice.success) {
    return { status: ReferenceStatus.Invalid, fiat, reason: `feed price: ${z.prettifyError(feedPrice.error)}` };
  }

  return {
    status: ReferenceStatus.Ok,
    fiat,
    price: feedPrice.data.price,
    decimals: decimals.data,
    oracleTime: Number(feedPrice.data.timestamp),
  };
}

/**
 * Seconds since the feed set this price, or `null` for the base currency, which never ages.
 * A price dated after `nowSeconds` (clock skew) is 0 seconds old.
 */
export function referenceAgeSeconds(reference: ReferencePrice, nowSeconds: number): number | null {
  if (reference.oracleTime === null) {
    return null;
  }

  return Math.max(0, nowSeconds - reference.oracleTime);
}
