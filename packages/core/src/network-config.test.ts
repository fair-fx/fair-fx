import { ConfigError, Network, parseNetworkConfig } from '@fair-fx/core';

const MAINNET = {
  passphrase: 'Public Global Stellar Network ; September 2015',
  horizonUrl: 'https://horizon.stellar.org',
  rpcUrl: 'https://mainnet.sorobanrpc.com',
  aquariusFindPathUrl: 'https://amm-api.aqua.network/pools/find-path/',
  soroswapRouter: 'CAG5LRYQ5JVEUI5TEID72EYOVX44TTUJT5BQR2J6J77FH65PCCFAJDDH',
  reflectorFiatFeed: 'CBKGPWGKSKZF52CFHMTRR23TBWTPMRDIYZ4O2P5VS65BMHYH4DXMCJZC',
  simulationSource: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
};

describe('parseNetworkConfig', () => {
  it.each([
    ['a plain http endpoint', { mainnet: { ...MAINNET, rpcUrl: 'http://mainnet.sorobanrpc.com' } }, Network.Mainnet,
      'networks.mainnet.rpcUrl: expected an https URL, got http://mainnet.sorobanrpc.com'],
    ['an account where a contract belongs', { mainnet: { ...MAINNET, soroswapRouter: MAINNET.simulationSource } },
      Network.Mainnet, `networks.mainnet.soroswapRouter: expected a contract ID (C...), got ${MAINNET.simulationSource}`],
    ['a network that is not configured', { mainnet: MAINNET }, Network.Testnet, 'networks.testnet: missing'],
  ])('refuses %s and names the field', (_, json, network, message) => {
    const parse = (): unknown => parseNetworkConfig(json, network);

    expect(parse).toThrow(new ConfigError(message));
  });
});
