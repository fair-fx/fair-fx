import { env } from 'node:process';

export const CORE_NODE_ENTRY = 'node' as const;

export function readEnv(name: string): string | undefined {
  return env[name];
}
