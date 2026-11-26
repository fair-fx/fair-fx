import { env } from 'node:process';

export { loadConfig, type Config } from './config.ts';
export { readReference } from './reference-reader.ts';
export { sorobanReferenceFeed, type ReferenceFeedNetwork } from './soroban-reference-feed.ts';

export function readEnv(name: string): string | undefined {
  return env[name];
}
