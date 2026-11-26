import { runner } from 'node-pg-migrate';
import { MIGRATIONS_DIR, MIGRATIONS_TABLE } from './migrate.constants.ts';

/**
 * Applies the migrations the database at `databaseUrl` does not have yet, in one transaction, and
 * resolves to their names in the order they ran. `log` receives the runner's progress lines.
 */
export async function migrate(databaseUrl: string, log: (message: string) => void): Promise<readonly string[]> {
  const applied = await runner({
    databaseUrl,
    dir: MIGRATIONS_DIR,
    migrationsTable: MIGRATIONS_TABLE,
    direction: 'up',
    log,
  });

  return applied.map((migration) => migration.name);
}
