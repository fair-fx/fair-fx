import { migrate } from '@fair-fx/db';
import {
  discardLog,
  openEmptyDatabase,
  openMigratedDatabase,
  tableNames,
  type TestDatabase,
} from '@fair-fx/db/testing';

describe('migrate', () => {
  let testDatabase: TestDatabase;

  afterEach(() => testDatabase.database.end());

  it('creates the tables of a run and its samples in an empty database', async () => {
    testDatabase = await openEmptyDatabase();

    const applied = await migrate(testDatabase.url, discardLog);

    expect(applied).toEqual(['0001_run-and-samples']);
    expect(await tableNames(testDatabase.database)).toEqual([
      'pgmigrations',
      'quote_sample',
      'reference_sample',
      'run',
    ]);
  });

  it('applies nothing to a database that has every migration', async () => {
    testDatabase = await openMigratedDatabase();

    const applied = await migrate(testDatabase.url, discardLog);

    expect(applied).toEqual([]);
  });
});
