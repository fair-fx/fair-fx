import { Direction, Fiat, QuoteStatus, ReferenceSource, VenueId } from '@fair-fx/core';
import { buildPair, buildReferencePrice } from '@fair-fx/core/testing';
import type { ReferenceSet, TakenQuote } from './quotes.types.ts';

/** USD at 1 and EUR at 1.0953 USD, both with 14 decimals, read from the Reflector fiat feed. */
export function buildReferenceSet(overrides: Partial<ReferenceSet> = {}): ReferenceSet {
  return {
    source: ReferenceSource.ReflectorFx,
    readings: [
      buildReferencePrice({ fiat: Fiat.Usd, price: 100_000_000_000_000n, oracleTime: null }),
      buildReferencePrice(),
    ],
    ...overrides,
  };
}

/** SDEX paying 91.8509809 EURC for 100 USDC, 60 bps better than the price of `buildReferenceSet`. */
export function buildTakenQuote(overrides: Partial<TakenQuote> = {}): TakenQuote {
  return {
    pair: buildPair(),
    direction: Direction.BaseToQuote,
    venue: VenueId.Sdex,
    amountIn: 1_000_000_000n,
    quotedAt: new Date('2026-11-26T08:56:01.250Z'),
    quote: { status: QuoteStatus.Ok, amountOut: 918_509_809n, route: { path: [] }, ledger: 65_680_158 },
    ...overrides,
  };
}
