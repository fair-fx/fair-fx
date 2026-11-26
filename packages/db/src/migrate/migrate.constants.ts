import { resolve } from 'node:path';

/** The SQL files, in `packages/db/migrations`: two folders up from this one, in `src` and in `dist` alike. */
export const MIGRATIONS_DIR = resolve(import.meta.dirname, '../../migrations');

/**
 * The table that records which migrations ran. The name the `node-pg-migrate` command uses when given
 * none, so `pnpm migrate` and `migrate()` keep one record.
 */
export const MIGRATIONS_TABLE = 'pgmigrations';
