import { ReferenceState } from '@fair-fx/core';
import {
  buildFinishedRun,
  buildNoRouteQuoteSample,
  buildPricedQuoteSample,
  commitHeldSlot,
  holdSlot,
  openMigratedDatabase,
  readStored,
  SLOT,
  untilASessionWaits,
  type TestDatabase,
} from '@fair-fx/db/testing';
import { writeRun } from '@fair-fx/db/writes';

describe('writeRun, one run per slot', () => {
  let testDatabase: TestDatabase;

  beforeEach(async () => {
    testDatabase = await openMigratedDatabase();
  });

  afterEach(() => testDatabase.database.end());

  it('stores nothing and says the slot is taken when a run of the slot is stored already', async () => {
    const first = buildFinishedRun({ references: [], quotes: [] });
    await writeRun(testDatabase.database, first);
    const second = buildFinishedRun({ referenceState: ReferenceState.Closed, quotes: [buildNoRouteQuoteSample()] });

    const outcome = await writeRun(testDatabase.database, second);

    expect(outcome).toBe('slot_taken');
    expect(await readStored(testDatabase.database)).toEqual({
      runs: [expect.objectContaining({ reference_state: 'fresh' })],
      references: [],
      quotes: [],
    });
  });

  it('waits for a run that is writing the same slot, then says the slot is taken', async () => {
    const writing = await holdSlot(testDatabase.database, SLOT);

    const outcome = writeRun(testDatabase.database, buildFinishedRun());
    await untilASessionWaits(testDatabase.database);
    await commitHeldSlot(writing);

    expect(await outcome).toBe('slot_taken');
    expect(await readStored(testDatabase.database)).toEqual({
      runs: [expect.objectContaining({ reference_state: 'unknown' })],
      references: [],
      quotes: [],
    });
  });

  it('gives up on a run that holds the slot for longer than the statement limit', async () => {
    const writing = await holdSlot(testDatabase.database, SLOT);

    const outcome = writeRun(testDatabase.database, buildFinishedRun(), 50);

    await expect(outcome).rejects.toMatchObject({ code: '57014' });
    await commitHeldSlot(writing);
  });

  it('stores nothing of a run when the database refuses one of its rows', async () => {
    const run = buildFinishedRun({ quotes: [buildPricedQuoteSample(), buildPricedQuoteSample()] });

    const outcome = writeRun(testDatabase.database, run);

    await expect(outcome).rejects.toMatchObject({ code: '23505', constraint: 'quote_sample_pkey' });
    expect(await readStored(testDatabase.database)).toEqual({ runs: [], references: [], quotes: [] });
  });
});
