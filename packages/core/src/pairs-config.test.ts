import { ConfigError, Fiat, Network, parsePairsConfig, requirePinnedAsset, UnpinnedAssetError } from '@fair-fx/core';

const USDC_ISSUER = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
const EURC_ISSUER = 'GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2';
const EURC_CONTRACT = 'CDTKPWPLOURQA2SGTKTUQOWRCBZEORB4BWBOMJ3D3ZTQQSGE5F6JBQLV';
// One of the EURCV issuers Horizon lists, not confirmed by SG-FORGE, and the SAC of EURCV from it.
const IMPERSONATOR_ISSUER = 'GCEYGIVOLAVBF2TG2RUSGTUJCIN75KEX3NGLMY4VPL4GFE5L355AXW3G';
const IMPERSONATOR_CONTRACT = 'CANKBYNNAYKEZXLB655F2UPNTAZFK5HILZUXL7ZTFR3NF6LKDSVY7KFH';

const USDC = {
  contract: 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75',
  classic: `USDC:${USDC_ISSUER}`,
  fiat: 'USD',
  decimals: 7,
};
const EURC = { contract: EURC_CONTRACT, classic: `EURC:${EURC_ISSUER}`, fiat: 'EUR', decimals: 7 };
const LADDER = [100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];

type PairsJsonOverrides = { id?: string; base?: unknown; quote?: unknown; ladder?: unknown };

function pairsJson({ id = 'USDC/EURC', base = USDC, quote = EURC, ladder = LADDER }: PairsJsonOverrides = {}): unknown {
  return { ladder, pairs: { mainnet: { [id]: { base, quote } } } };
}

describe('requirePinnedAsset', () => {
  it.each([
    ['by contract ID', { contract: EURC_CONTRACT }],
    ['by code and issuer', { code: 'EURC', issuer: EURC_ISSUER }],
  ])('returns a pinned asset looked up %s', (_, ref) => {
    const config = parsePairsConfig(pairsJson(), Network.Mainnet);

    const asset = requirePinnedAsset(config, ref);

    expect(asset).toEqual({ contract: EURC_CONTRACT, code: 'EURC', issuer: EURC_ISSUER, fiat: Fiat.Eur, decimals: 7 });
  });

  it.each([
    ['a contract ID not in the pair list', { contract: IMPERSONATOR_CONTRACT }],
    ['a pinned code from another issuer', { code: 'EURC', issuer: IMPERSONATOR_ISSUER }],
  ])('refuses %s', (_, ref) => {
    const config = parsePairsConfig(pairsJson(), Network.Mainnet);

    const lookup = (): unknown => requirePinnedAsset(config, ref);

    expect(lookup).toThrow(UnpinnedAssetError);
  });
});

describe('parsePairsConfig', () => {
  it('returns the pairs of the network with the ladder as bigint', () => {
    const json = pairsJson();

    const config = parsePairsConfig(json, Network.Mainnet);

    expect(config.ladder).toEqual([100n, 250n, 500n, 1000n, 2500n, 5000n, 10000n, 25000n, 50000n, 100000n]);
    expect(config.pairs.map((pair) => pair.id)).toEqual(['USDC/EURC']);
  });

  it.each([
    ['a fiat the feed does not have', pairsJson({ base: { ...USDC, fiat: 'JPY' } }), Network.Mainnet,
      'pairs.mainnet.USDC/EURC.base.fiat: expected one of USD, EUR, got JPY'],
    ['a misspelt key', pairsJson({ base: { ...USDC, decimal: 7 } }), Network.Mainnet,
      'pairs.mainnet.USDC/EURC.base.decimal: unknown key'],
    ['a code without an issuer', pairsJson({ base: { ...USDC, classic: 'USDC' } }), Network.Mainnet,
      'pairs.mainnet.USDC/EURC.base.classic: expected CODE:ISSUER, got USDC'],
    ['the same asset on both sides', pairsJson({ id: 'USDC/USDC', quote: USDC }), Network.Mainnet,
      'pairs.mainnet.USDC/USDC: base and quote are the same asset'],
    ['an id that does not match the assets', pairsJson({ id: 'EURC/USDC' }), Network.Mainnet,
      'pairs.mainnet.EURC/USDC: expected the id USDC/EURC'],
    ['a ladder that does not increase', pairsJson({ ladder: [100, 250, 250, 1000, 2500, 5000, 10000, 25000, 50000, 100000] }),
      Network.Mainnet, 'ladder[2]: expected more than the rung before it'],
    ['a network with no pairs', pairsJson(), Network.Testnet, 'pairs.testnet: missing'],
    ['a misspelt network', { ladder: LADDER, pairs: { mainnet: {}, tesnet: {} } }, Network.Mainnet,
      'pairs.tesnet: expected one of mainnet, testnet'],
  ])('refuses %s and names the field', (_, json, network, message) => {
    const parse = (): unknown => parsePairsConfig(json, network);

    expect(parse).toThrow(new ConfigError(message));
  });
});
