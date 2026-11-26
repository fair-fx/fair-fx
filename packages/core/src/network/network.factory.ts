import { Network, type NetworkConfig } from './network.types.ts';

export function buildNetworkConfig(overrides: Partial<NetworkConfig> = {}): NetworkConfig {
  return {
    passphrase: 'Public Global Stellar Network ; September 2015',
    horizonUrl: 'https://horizon.stellar.org',
    rpcUrl: 'https://mainnet.sorobanrpc.com',
    aquariusFindPathUrl: 'https://amm-api.aqua.network/api/external/v2/find-path/',
    soroswapRouter: 'CAG5LRYQ5JVEUI5TEID72EYOVX44TTUJT5BQR2J6J77FH65PCCFAJDDH',
    reflectorFiatFeed: 'CBKGPWGKSKZF52CFHMTRR23TBWTPMRDIYZ4O2P5VS65BMHYH4DXMCJZC',
    simulationSource: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
    ...overrides,
  };
}

/**
 * Raw `networks.json` with one mainnet entry, `mainnet` spread over a valid default.
 * `mainnet` is loosely typed so a test can write values the schema refuses.
 */
export function buildNetworksFile(mainnet: object = {}): unknown {
  return { [Network.Mainnet]: { ...buildNetworkConfig(), ...mainnet } };
}
