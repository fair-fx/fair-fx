import { Pool } from 'pg';
import type { Database } from './database.types.ts';

/**
 * Opens a pool on the database at `databaseUrl`. No connection is made until the first query.
 *
 * The caller listens for the pool's `error` event: without a listener, a connection that breaks while
 * idle stops the process. The caller also ends the pool.
 */
export function openDatabase(databaseUrl: string): Database {
  return new Pool({ connectionString: databaseUrl });
}
