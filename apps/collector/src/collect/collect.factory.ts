import { GuardMode, QuoteStatus, ReferenceSource, VenueId, type VenueAdapter } from '@fair-fx/core';
import { WriteRunOutcome } from '@fair-fx/db/writes';
import { buildLedgerSource, buildPair, buildReferenceFeed, WEEKEND_WINDOW } from '@fair-fx/core/testing';
import type { CollectorPlan, CollectorPorts } from './collect.types.ts';

/** A venue that pays 0.9185 of the amount in, in the smallest unit of the output token, every time. */
export function buildVenueAdapter(overrides: Partial<VenueAdapter> = {}): VenueAdapter {
  return {
    id: VenueId.Sdex,
    mode: GuardMode.B,
    quote: (_pair, _direction, amountIn) =>
      Promise.resolve({
        status: QuoteStatus.Ok,
        amountOut: (amountIn * 9_185n) / 10_000n,
        route: { path: [] },
        ledger: 65_693_709,
      }),
    ...overrides,
  };
}

/** USDC/EURC on a ladder of 100 and 250, judged with the weekend closed. */
export function buildCollectorPlan(overrides: Partial<CollectorPlan> = {}): CollectorPlan {
  return {
    pairs: [buildPair()],
    ladder: [100n, 250n],
    referenceSource: ReferenceSource.ReflectorFx,
    closedWindow: WEEKEND_WINDOW,
    ...overrides,
  };
}

/**
 * One venue, a feed whose EUR price was set 60 seconds before the latest ledger closed (mainnet
 * ledger 65,693,709, 2026-11-27 04:43:36 UTC, a Friday), a collector clock that stays 5 seconds
 * after that, and a store that writes every run.
 */
export function buildCollectorPorts(overrides: Partial<CollectorPorts> = {}): CollectorPorts {
  return {
    venues: [buildVenueAdapter()],
    feed: buildReferenceFeed({
      lastPrice: () => Promise.resolve({ price: 109_531_321_156_430n, timestamp: 1_795_754_556n }),
    }),
    ledger: buildLedgerSource(),
    now: () => new Date('2026-11-27T04:43:41.000Z'),
    store: () => Promise.resolve(WriteRunOutcome.Written),
    ...overrides,
  };
}
