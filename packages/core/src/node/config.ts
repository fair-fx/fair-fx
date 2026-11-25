import { readFile } from 'node:fs/promises';
import {
  ConfigError,
  parseNetworkConfig,
  parsePairsConfig,
  type Network,
  type NetworkConfig,
  type PairsConfig,
} from '../index.ts';

/** Reads `config/networks.json` at `path` and returns the entry for `network`. */
export async function loadNetworkConfig(path: string | URL, network: Network): Promise<NetworkConfig> {
  return parseNetworkConfig(await readJson(path), network);
}

/** Reads `config/pairs.json` at `path` and returns the pairs of `network`. */
export async function loadPairsConfig(path: string | URL, network: Network): Promise<PairsConfig> {
  return parsePairsConfig(await readJson(path), network);
}

async function readJson(path: string | URL): Promise<unknown> {
  const text = await readFile(path, 'utf8');
  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    throw new ConfigError(`${String(path)}: not valid JSON`, { cause: error });
  }
}
