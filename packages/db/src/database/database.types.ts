import type { Pool, PoolClient } from 'pg';

/** A pool of connections to the FairFX database. */
export type Database = Pool;

/** One connection taken from the pool, for statements that must run in the same session. */
export type DatabaseSession = PoolClient;
