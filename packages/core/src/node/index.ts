import { env } from 'node:process';

export function readEnv(name: string): string | undefined {
  return env[name];
}
