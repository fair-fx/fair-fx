import {
  ConfigError,
  Network,
  parseNetworkConfig,
  parsePairsConfig,
  requirePinnedAsset,
  UnpinnedAssetError,
} from '@fair-fx/core';

const USDC = {
  contract: 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75',
  code: 'USDC',
  issuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
  fiat: 'USD',
  decimals: 7,
};
const EURC = {
  contract: 'CDTKPWPLOURQA2SGTKTUQOWRCBZEORB4BWBOMJ3D3ZTQQSGE5F6JBQLV',
  code: 'EURC',
  issuer: 'GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2',
  fiat: 'EUR',
  decimals: 7,
};
// An EURCV issuer its company has not confirmed, and the SAC of EURCV from it.
const IMPERSONATOR = {
  issuer: 'GCEYGIVOLAVBF2TG2RUSGTUJCIN75KEX3NGLMY4VPL4GFE5L355AXW3G',
  contract: 'CANKBYNNAYKEZXLB655F2UPNTAZFK5HILZUXL7ZTFR3NF6LKDSVY7KFH',
};
const LADDER = [100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];
const MAINNET = {
  passphrase: 'Public Global Stellar Network ; September 2015',
  horizonUrl: 'https://horizon.stellar.org',
  rpcUrl: 'https://mainnet.sorobanrpc.com',
  aquariusFindPathUrl: 'https://amm-api.aqua.network/pools/find-path/',
  soroswapRouter: 'CAG5LRYQ5JVEUI5TEID72EYOVX44TTUJT5BQR2J6J77FH65PCCFAJDDH',
  reflectorFiatFeed: 'CBKGPWGKSKZF52CFHMTRR23TBWTPMRDIYZ4O2P5VS65BMHYH4DXMCJZC',
  simulationSource: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
};

type PairsFileOverrides = { base?: object; quote?: object; ladder?: readonly number[] };

function pairsFile({ base = USDC, quote = EURC, ladder = LADDER }: PairsFileOverrides = {}): unknown {
  return { ladder, pairs: { mainnet: [{ base, quote }] } };
}

describe('requirePinnedAsset', () => {
  const config = parsePairsConfig(pairsFile(), Network.Mainnet);

  it.each([
    { by: 'contract ID', ref: { contract: EURC.contract } },
    { by: 'code and issuer', ref: { code: 'EURC', issuer: EURC.issuer } },
  ])('returns a pinned asset looked up by $by', ({ ref }) => {
    const asset = requirePinnedAsset(config, ref);

    expect(asset).toEqual(EURC);
  });

  it.each([
    { what: 'a contract ID not in the pair list', ref: { contract: IMPERSONATOR.contract } },
    { what: 'a pinned code from another issuer', ref: { code: 'EURC', issuer: IMPERSONATOR.issuer } },
  ])('refuses $what', ({ ref }) => {
    const lookup = (): unknown => requirePinnedAsset(config, ref);

    expect(lookup).toThrow(UnpinnedAssetError);
  });
});

describe('parsePairsConfig', () => {
  it('returns the pairs of the network with an id and the ladder as bigint', () => {
    const config = parsePairsConfig(pairsFile(), Network.Mainnet);

    expect(config.pairs.map((pair) => pair.id)).toEqual(['USDC/EURC']);
    expect(config.ladder).toEqual([100n, 250n, 500n, 1000n, 2500n, 5000n, 10000n, 25000n, 50000n, 100000n]);
  });

  it.each([
    {
      what: 'a fiat the feed does not have',
      json: pairsFile({ base: { ...USDC, fiat: 'JPY' } }),
      at: 'pairs.mainnet[0].base.fiat',
      message: 'Invalid option: expected one of "USD"|"EUR"',
    },
    {
      what: 'a misspelt key',
      json: pairsFile({ base: { ...USDC, decimal: 7 } }),
      at: 'pairs.mainnet[0].base',
      message: 'Unrecognized key: "decimal"',
    },
    {
      what: 'the same asset on both sides',
      json: pairsFile({ quote: USDC }),
      at: 'pairs.mainnet[0]',
      message: 'base and quote are the same asset',
    },
    {
      what: 'a ladder that does not increase',
      json: pairsFile({ ladder: LADDER.with(2, 250) }),
      at: 'ladder',
      message: 'expected each rung to be larger than the one before',
    },
    {
      what: 'a ladder without 10 rungs',
      json: pairsFile({ ladder: LADDER.slice(1) }),
      at: 'ladder',
      message: 'Too small: expected array to have exactly 10 items',
    },
    {
      what: 'a misspelt network',
      json: { ladder: LADDER, pairs: { tesnet: [] } },
      at: 'pairs',
      message: 'Unrecognized key: "tesnet"',
    },
  ])('refuses $what at $at', ({ json, at, message }) => {
    const parse = (): unknown => parsePairsConfig(json, Network.Mainnet);

    expect(parse).toThrow(`✖ ${message}\n  → at ${at}`);
  });

  it('refuses a network with no pairs', () => {
    const parse = (): unknown => parsePairsConfig(pairsFile(), Network.Testnet);

    expect(parse).toThrow(new ConfigError('no entry for testnet'));
  });
});

describe('parseNetworkConfig', () => {
  it.each([
    {
      what: 'a plain http endpoint',
      json: { mainnet: { ...MAINNET, rpcUrl: 'http://mainnet.sorobanrpc.com' } },
      at: 'mainnet.rpcUrl',
      message: 'expected an https URL',
    },
    {
      what: 'an account where a contract belongs',
      json: { mainnet: { ...MAINNET, soroswapRouter: MAINNET.simulationSource } },
      at: 'mainnet.soroswapRouter',
      message: 'expected a contract ID (C...)',
    },
  ])('refuses $what at $at', ({ json, at, message }) => {
    const parse = (): unknown => parseNetworkConfig(json, Network.Mainnet);

    expect(parse).toThrow(`✖ ${message}\n  → at ${at}`);
  });
});
