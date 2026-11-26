import {
  Direction,
  Fiat,
  NoRouteCause,
  QuoteErrorCause,
  QuoteStatus,
  ReferenceSource,
  ReferenceState,
  ReferenceStatus,
  VenueId,
} from '@fair-fx/core';
import type { FinishedRun, PricedQuoteSample, ReferenceSample, UnpricedQuoteSample } from './run.types.ts';

/** The slot every built run is for: 2026-11-26 08:55 UTC. */
export const SLOT = new Date('2026-11-26T08:55:00.000Z');

/** EUR at 1.0953 USD with 14 decimals, set by the feed at the start of `SLOT`. */
export function buildReferenceSample(overrides: Partial<ReferenceSample> = {}): ReferenceSample {
  return {
    source: ReferenceSource.ReflectorFx,
    reading: {
      status: ReferenceStatus.Ok,
      fiat: Fiat.Eur,
      price: 109_531_321_156_430n,
      decimals: 14,
      oracleTime: 1_795_683_300,
    },
    ...overrides,
  };
}

/** SDEX paying 91.8509809 EURC for 100 USDC, 60 bps better than the reference. */
export function buildPricedQuoteSample(overrides: Partial<PricedQuoteSample> = {}): PricedQuoteSample {
  return {
    pair: 'USDC/EURC',
    direction: Direction.BaseToQuote,
    venue: VenueId.Sdex,
    amountIn: 1_000_000_000n,
    quotedAt: new Date('2026-11-26T08:56:01.250Z'),
    quote: { status: QuoteStatus.Ok, amountOut: 918_509_809n, route: { path: [] }, ledger: 65_680_158 },
    shortfall: { bps: -60n, source: ReferenceSource.ReflectorFx },
    ...overrides,
  };
}

/** Soroswap having no pool for 100 USDC to EURC. */
export function buildNoRouteQuoteSample(overrides: Partial<UnpricedQuoteSample> = {}): UnpricedQuoteSample {
  return {
    pair: 'USDC/EURC',
    direction: Direction.BaseToQuote,
    venue: VenueId.Soroswap,
    amountIn: 1_000_000_000n,
    quotedAt: new Date('2026-11-26T08:56:02.500Z'),
    quote: { status: QuoteStatus.NoRoute, cause: NoRouteCause.NoPath },
    ...overrides,
  };
}

/** Aquarius not answering in time for 100 USDC to EURC. */
export function buildErrorQuoteSample(overrides: Partial<UnpricedQuoteSample> = {}): UnpricedQuoteSample {
  return {
    pair: 'USDC/EURC',
    direction: Direction.BaseToQuote,
    venue: VenueId.Aquarius,
    amountIn: 1_000_000_000n,
    quotedAt: new Date('2026-11-26T08:56:11.000Z'),
    quote: { status: QuoteStatus.Error, cause: QuoteErrorCause.Timeout, reason: 'no answer within 10000 ms' },
    ...overrides,
  };
}

/** A run of `SLOT` with a fresh reference and one priced quote. */
export function buildFinishedRun(overrides: Partial<FinishedRun> = {}): FinishedRun {
  return {
    slot: SLOT,
    startedAt: new Date('2026-11-26T08:56:00.000Z'),
    finishedAt: new Date('2026-11-26T08:56:12.000Z'),
    ledger: 65_680_158,
    referenceState: ReferenceState.Fresh,
    references: [buildReferenceSample()],
    quotes: [buildPricedQuoteSample()],
    ...overrides,
  };
}
