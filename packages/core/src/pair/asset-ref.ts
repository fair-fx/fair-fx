import type { AssetRef, PinnedAsset } from '../asset/index.ts';

/** True when `asset` is the one `ref` names, by contract or by code and issuer. */
export function matchesRef(asset: PinnedAsset, ref: AssetRef): boolean {
  if ('contract' in ref) {
    return asset.contract === ref.contract;
  }

  return asset.code === ref.code && asset.issuer === ref.issuer;
}

export function describeRef(ref: AssetRef): string {
  return 'contract' in ref ? ref.contract : `${ref.code}:${ref.issuer}`;
}
