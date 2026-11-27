import { PostgreSqlContainer } from '@testcontainers/postgresql';
import type { TestProject } from 'vitest/node';
import { migrate } from '../migrate/index.ts';
import { discardLog } from './discard-log.ts';
import type {} from './provided-context.ts';
import { MIGRATED_DATABASE, POSTGRES_IMAGE } from './testing.constants.ts';

/**
 * Starts one Postgres server in a container for the whole test run and applies the migrations to one
 * database on it. Resolves to the function that stops the server.
 */
export default async function startPostgres(project: TestProject): Promise<() => Promise<void>> {
  const container = await new PostgreSqlContainer(POSTGRES_IMAGE).withDatabase(MIGRATED_DATABASE).start();
  await migrate(container.getConnectionUri(), discardLog);
  project.provide('migratedDatabaseUrl', container.getConnectionUri());

  return async () => {
    await container.stop();
  };
}
