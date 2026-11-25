import { env } from 'node:process';

export { loadNetworkConfig, loadPairsConfig } from './config.ts';

export function readEnv(name: string): string | undefined {
  return env[name];
}
