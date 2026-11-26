import { randomUUID } from 'node:crypto';
import { Client } from 'pg';
import { inject } from 'vitest';
import { openDatabase, type Database } from '../database/index.ts';
import { EMPTY_DATABASE, MAINTENANCE_DATABASE, MIGRATED_DATABASE } from './testing.constants.ts';

/** A database of its own for one test, on the server the global setup started. */
export interface TestDatabase {
  readonly url: string;
  readonly database: Database;
}

/** The URL of `name` on the same server as `serverUrl`. */
export function databaseUrlOn(serverUrl: string, name: string): string {
  const url = new URL(serverUrl);
  url.pathname = `/${name}`;

  return url.toString();
}

/** Creates a database as a copy of `template` and opens it. */
export async function createTestDatabase(template: string): Promise<TestDatabase> {
  const serverUrl = inject('migratedDatabaseUrl');
  const name = `test_${randomUUID().replaceAll('-', '')}`;
  const maintenance = new Client({ connectionString: databaseUrlOn(serverUrl, MAINTENANCE_DATABASE) });
  await maintenance.connect();
  try {
    await maintenance.query(`CREATE DATABASE ${name} TEMPLATE ${template}`);
  } finally {
    await maintenance.end();
  }

  const url = databaseUrlOn(serverUrl, name);

  return { url, database: openDatabase(url) };
}

/** A new database with every migration applied and no rows. */
export function openMigratedDatabase(): Promise<TestDatabase> {
  return createTestDatabase(MIGRATED_DATABASE);
}

/** A new database with nothing in it. */
export function openEmptyDatabase(): Promise<TestDatabase> {
  return createTestDatabase(EMPTY_DATABASE);
}
