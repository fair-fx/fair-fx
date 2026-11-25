/** Stellar network a config entry belongs to. Contract IDs differ per network. */
export enum Network {
  Mainnet = 'mainnet',
  Testnet = 'testnet',
}

/** Passphrase, endpoints and contract addresses of one network, from `config/networks.json`. */
export interface NetworkConfig {
  readonly passphrase: string;
  readonly horizonUrl: string;
  readonly rpcUrl: string;
  readonly aquariusFindPathUrl: string;
  /** Contract ID of the Soroswap router. */
  readonly soroswapRouter: string;
  /** Contract ID of the Reflector fiat FX feed. */
  readonly reflectorFiatFeed: string;
  /** Source account for read-only simulations. Nothing is signed with it. */
  readonly simulationSource: string;
}
