import { readAccountId, readContractId, readHttpsUrl, readNetworkEntry, readObject, readString } from './json-fields.ts';
import type { Network } from './network.ts';

/** Endpoints and contract addresses of one network, from `config/networks.json`. */
export interface NetworkConfig {
  readonly network: Network;
  readonly passphrase: string;
  readonly horizonUrl: string;
  readonly rpcUrl: string;
  readonly aquariusFindPathUrl: string;
  readonly soroswapRouter: string;
  readonly reflectorFiatFeed: string;
  /** Source account for read-only simulations. Nothing is signed with it. */
  readonly simulationSource: string;
}

const KEYS = [
  'passphrase',
  'horizonUrl',
  'rpcUrl',
  'aquariusFindPathUrl',
  'soroswapRouter',
  'reflectorFiatFeed',
  'simulationSource',
] as const;

/** Validates the parsed `networks.json` and returns the entry for `network`. Throws ConfigError. */
export function parseNetworkConfig(json: unknown, network: Network): NetworkConfig {
  const field = `networks.${network}`;
  const entry = readObject(readNetworkEntry(json, 'networks', network), field, KEYS);
  return {
    network,
    passphrase: readString(entry.passphrase, `${field}.passphrase`),
    horizonUrl: readHttpsUrl(entry.horizonUrl, `${field}.horizonUrl`),
    rpcUrl: readHttpsUrl(entry.rpcUrl, `${field}.rpcUrl`),
    aquariusFindPathUrl: readHttpsUrl(entry.aquariusFindPathUrl, `${field}.aquariusFindPathUrl`),
    soroswapRouter: readContractId(entry.soroswapRouter, `${field}.soroswapRouter`),
    reflectorFiatFeed: readContractId(entry.reflectorFiatFeed, `${field}.reflectorFiatFeed`),
    simulationSource: readAccountId(entry.simulationSource, `${field}.simulationSource`),
  };
}
