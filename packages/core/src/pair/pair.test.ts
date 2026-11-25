import { ConfigError, Network, parsePairsConfig } from '@fair-fx/core';
import { buildPairsFile, LADDER_UNITS, USDC } from '@fair-fx/core/testing';

describe('parsePairsConfig', () => {
  it('returns the pairs of the network with an id and the ladder as bigint', () => {
    const config = parsePairsConfig(buildPairsFile(), Network.Mainnet);

    expect(config.pairs.map((pair) => pair.id)).toEqual(['USDC/EURC']);
    expect(config.ladder).toEqual([100n, 250n, 500n, 1000n, 2500n, 5000n, 10000n, 25000n, 50000n, 100000n]);
  });

  it.each([
    {
      what: 'a fiat the feed does not have',
      json: buildPairsFile({ base: { fiat: 'JPY' } }),
      at: 'pairs.mainnet[0].base.fiat',
      message: 'Invalid option: expected one of "USD"|"EUR"',
    },
    {
      what: 'a misspelt key',
      json: buildPairsFile({ base: { decimal: 7 } }),
      at: 'pairs.mainnet[0].base',
      message: 'Unrecognized key: "decimal"',
    },
    {
      what: 'the same asset on both sides',
      json: buildPairsFile({ quote: USDC }),
      at: 'pairs.mainnet[0]',
      message: 'base and quote are the same asset',
    },
    {
      what: 'a ladder that does not increase',
      json: buildPairsFile({ ladder: LADDER_UNITS.with(2, 250) }),
      at: 'ladder',
      message: 'expected each rung to be larger than the one before',
    },
    {
      what: 'a ladder without 10 rungs',
      json: buildPairsFile({ ladder: LADDER_UNITS.slice(1) }),
      at: 'ladder',
      message: 'Too small: expected array to have exactly 10 items',
    },
    {
      what: 'a misspelt network',
      json: { ladder: LADDER_UNITS, pairs: { tesnet: [] } },
      at: 'pairs',
      message: 'Unrecognized key: "tesnet"',
    },
  ])('refuses $what at $at', ({ json, at, message }) => {
    const parse = (): unknown => parsePairsConfig(json, Network.Mainnet);

    expect(parse).toThrow(`✖ ${message}\n  → at ${at}`);
  });

  it('refuses a network with no pairs', () => {
    const parse = (): unknown => parsePairsConfig(buildPairsFile(), Network.Testnet);

    expect(parse).toThrow(new ConfigError('no entry for testnet'));
  });
});
