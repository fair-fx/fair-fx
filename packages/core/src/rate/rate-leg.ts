import type { PinnedAsset } from '../asset/index.ts';
import { ReferenceStatus, type ReferenceReading } from '../reference/index.ts';
import type { RateLeg } from './rate.types.ts';

/**
 * The leg of `asset` at the reference price of its currency, or `null` when `readings` holds no
 * price for that currency. The price is taken as it was read: judging its age is the caller's decision.
 */
export function rateLeg(asset: PinnedAsset, readings: readonly ReferenceReading[]): RateLeg | null {
  const reading = readings.find((candidate) => candidate.fiat === asset.fiat);
  if (reading?.status !== ReferenceStatus.Ok) {
    return null;
  }

  return { price: reading.price, decimals: asset.decimals };
}
