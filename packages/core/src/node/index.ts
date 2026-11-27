import { env } from 'node:process';

export { loadConfig, type Config } from './config.ts';

export function readEnv(name: string): string | undefined {
  return env[name];
}
