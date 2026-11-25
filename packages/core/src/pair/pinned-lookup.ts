import type { AssetRef, PinnedAsset } from '../asset/index.ts';
import type { Network } from '../network/index.ts';
import type { PairsConfig } from './pair.ts';

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
  const asset = config.pairs.flatMap((pair) => [pair.base, pair.quote]).find((pinned) => matches(pinned, ref));
  if (asset === undefined) {
    throw new UnpinnedAssetError(config.network, ref);
  }
  return asset;
}

function matches(asset: PinnedAsset, ref: AssetRef): boolean {
  if ('contract' in ref) {
    return asset.contract === ref.contract;
  }
  return asset.code === ref.code && asset.issuer === ref.issuer;
}

function describeRef(ref: AssetRef): string {
  return 'contract' in ref ? ref.contract : `${ref.code}:${ref.issuer}`;
}
