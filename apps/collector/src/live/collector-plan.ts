import { DEFAULT_MARKET_HOURS, ReferenceSource, type PairsConfig } from '@fair-fx/core';
import type { CollectorPlan } from '../collect/index.ts';

/** What a live run asks for: every pair and rung of `config`, priced by the Reflector fiat feed. */
export function collectorPlan(config: PairsConfig): CollectorPlan {
  return {
    pairs: config.pairs,
    ladder: config.ladder,
    referenceSource: ReferenceSource.ReflectorFx,
    closedWindow: DEFAULT_MARKET_HOURS.closedWindow,
  };
}
