import type { AssetRef, PinnedAsset } from '../asset/index.ts';
import type { Network } from '../network/index.ts';
import { describeRef, matchesRef } from './asset-ref.ts';
import type { PairsConfig } from './pair.types.ts';

/** A lookup named an asset that is not in `config/pairs.json` for this network. */
export class UnpinnedAssetError extends Error {
  override readonly name = 'UnpinnedAssetError';

  constructor(
    readonly network: Network,
    readonly ref: AssetRef,
  ) {
    super(`${describeRef(ref)} is not a pinned asset on ${network}`);
  }
}

/** Returns the pinned asset `ref` names, or throws UnpinnedAssetError. */
export function requirePinnedAsset(config: PairsConfig, ref: AssetRef): PinnedAsset {
  const asset = config.pairs.flatMap((pair) => [pair.base, pair.quote]).find((pinned) => matchesRef(pinned, ref));
  if (asset === undefined) {
    throw new UnpinnedAssetError(config.network, ref);
  }

  return asset;
}
