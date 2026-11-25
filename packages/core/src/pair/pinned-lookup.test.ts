import { requirePinnedAsset, UnpinnedAssetError } from '@fair-fx/core';
import { buildPairsConfig, EURC, EURCV_IMPERSONATOR } from '@fair-fx/core/testing';

describe('requirePinnedAsset', () => {
  const config = buildPairsConfig();

  it.each([
    { by: 'contract ID', ref: { contract: EURC.contract } },
    { by: 'code and issuer', ref: { code: 'EURC', issuer: EURC.issuer } },
  ])('returns a pinned asset looked up by $by', ({ ref }) => {
    const asset = requirePinnedAsset(config, ref);

    expect(asset).toEqual(EURC);
  });

  it.each([
    { what: 'a contract ID not in the pair list', ref: { contract: EURCV_IMPERSONATOR.contract } },
    { what: 'a pinned code from another issuer', ref: { code: 'EURC', issuer: EURCV_IMPERSONATOR.issuer } },
  ])('refuses $what', ({ ref }) => {
    const lookup = (): unknown => requirePinnedAsset(config, ref);

    expect(lookup).toThrow(UnpinnedAssetError);
  });
});
