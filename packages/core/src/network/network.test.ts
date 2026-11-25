import { Network, parseNetworkConfig } from '@fair-fx/core';
import { buildNetworkConfig, buildNetworksFile, USDC } from '@fair-fx/core/testing';

describe('parseNetworkConfig', () => {
  it('returns the entry of the network', () => {
    const config = parseNetworkConfig(buildNetworksFile(), Network.Mainnet);

    expect(config).toEqual(buildNetworkConfig());
  });

  it.each([
    {
      what: 'a plain http endpoint',
      json: buildNetworksFile({ rpcUrl: 'http://mainnet.sorobanrpc.com' }),
      at: 'mainnet.rpcUrl',
      message: 'expected an https URL',
    },
    {
      what: 'an account where a contract belongs',
      json: buildNetworksFile({ soroswapRouter: USDC.issuer }),
      at: 'mainnet.soroswapRouter',
      message: 'expected a contract ID (C...)',
    },
  ])('refuses $what at $at', ({ json, at, message }) => {
    const parse = (): unknown => parseNetworkConfig(json, Network.Mainnet);

    expect(parse).toThrow(`✖ ${message}\n  → at ${at}`);
  });
});
