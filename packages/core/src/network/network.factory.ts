import { Network, type NetworkConfig } from './network.ts';

export function buildNetworkConfig(overrides: Partial<NetworkConfig> = {}): NetworkConfig {
  return {
    passphrase: 'Public Global Stellar Network ; September 2015',
    horizonUrl: 'https://horizon.stellar.org',
    rpcUrl: 'https://mainnet.sorobanrpc.com',
    aquariusFindPathUrl: 'https://amm-api.aqua.network/pools/find-path/',
    soroswapRouter: 'CAG5LRYQ5JVEUI5TEID72EYOVX44TTUJT5BQR2J6J77FH65PCCFAJDDH',
    reflectorFiatFeed: 'CBKGPWGKSKZF52CFHMTRR23TBWTPMRDIYZ4O2P5VS65BMHYH4DXMCJZC',
    simulationSource: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
    ...overrides,
  };
}

// Spread over a valid default and loosely typed, so a test can write values the schema refuses.
type Patch = Readonly<Record<string, unknown>>;

/** Raw `networks.json` with one mainnet entry, `mainnet` patched. */
export function buildNetworksFile(mainnet: Patch = {}): unknown {
  return { [Network.Mainnet]: { ...buildNetworkConfig(), ...mainnet } };
}
