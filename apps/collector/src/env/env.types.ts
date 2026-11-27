import type { Network } from '@fair-fx/core';

/** The settings a collector run takes from its environment. */
export interface CollectorEnv {
  /** Never logged: it holds the database password. */
  readonly databaseUrl: string;
  readonly network: Network;
  /** The folder with `networks.json` and `pairs.json`. */
  readonly configDir: string;
}
