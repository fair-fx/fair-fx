import { env } from 'node:process';

export { loadConfig, type Config } from './load-config.ts';

export function readEnv(name: string): string | undefined {
  return env[name];
}
