import { Pool } from 'pg';
import { CONNECT_TIMEOUT_MS } from './database.constants.ts';
import type { Database } from './database.types.ts';

/**
 * Opens a pool on the database at `databaseUrl`. No connection is made until the first query, and one
 * that is not ready within `connectTimeoutMs` rejects the query that asked for it.
 *
 * The caller listens for the pool's `error` event: without a listener, a connection that breaks while
 * idle stops the process. The caller also ends the pool.
 */
export function openDatabase(databaseUrl: string, connectTimeoutMs = CONNECT_TIMEOUT_MS): Database {
  return new Pool({ connectionString: databaseUrl, connectionTimeoutMillis: connectTimeoutMs });
}
