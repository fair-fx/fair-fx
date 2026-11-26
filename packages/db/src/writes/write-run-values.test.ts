import {
  Direction,
  Fiat,
  QuoteErrorCause,
  QuoteStatus,
  ReferenceSource,
  ReferenceState,
  ReferenceStatus,
} from '@fair-fx/core';
import {
  buildErrorQuoteSample,
  buildFinishedRun,
  buildPricedQuoteSample,
  openMigratedDatabase,
  readStored,
  type TestDatabase,
} from '@fair-fx/db/testing';
import { writeRun } from '@fair-fx/db/writes';

describe('writeRun, values at the edge of what Postgres stores', () => {
  let testDatabase: TestDatabase;

  beforeEach(async () => {
    testDatabase = await openMigratedDatabase();
  });

  afterEach(() => testDatabase.database.end());

  it('keeps every digit of an amount and a price too large for a JavaScript number', async () => {
    const reading = {
      status: ReferenceStatus.Ok,
      fiat: Fiat.Eur,
      price: 123_456_789_012_345_678_901_234_567_890n,
      decimals: 14,
      oracleTime: 1_795_683_300,
    } as const;
    const priced = buildPricedQuoteSample();
    const run = buildFinishedRun({
      references: [{ source: ReferenceSource.ReflectorFx, reading }],
      quotes: [
        {
          ...priced,
          amountIn: 1_000_000_000_000_000_000_000_000_000_001n,
          quote: { ...priced.quote, amountOut: 918_509_809_000_000_000_000_000_000_007n },
        },
      ],
    });

    await writeRun(testDatabase.database, run);

    const stored = await readStored(testDatabase.database);
    expect(stored.references).toEqual([expect.objectContaining({ price: '123456789012345678901234567890' })]);
    expect(stored.quotes).toEqual([
      expect.objectContaining({
        amount_in: '1000000000000000000000000000001',
        amount_out: '918509809000000000000000000007',
      }),
    ]);
  });

  it('replaces the characters Postgres cannot store in the text a venue sent', async () => {
    const reason = 'bad\u0000body\uD800';
    const quote = { status: QuoteStatus.Error, cause: QuoteErrorCause.BadAnswer, reason } as const;
    const run = buildFinishedRun({ quotes: [buildErrorQuoteSample({ quote })] });

    await writeRun(testDatabase.database, run);

    const stored = await readStored(testDatabase.database);
    expect(stored.quotes).toEqual([expect.objectContaining({ reason: 'bad\uFFFDbody\uFFFD' })]);
  });

  it('stores a bigint inside a route as a decimal string', async () => {
    const priced = buildPricedQuoteSample();
    const route = { minimumOut: 918_509_809_000_000_000_000_000_000_007n };
    const run = buildFinishedRun({ quotes: [{ ...priced, quote: { ...priced.quote, route } }] });

    await writeRun(testDatabase.database, run);

    const stored = await readStored(testDatabase.database);
    expect(stored.quotes).toEqual([
      expect.objectContaining({ route: { minimumOut: '918509809000000000000000000007' } }),
    ]);
  });

  // The two tests below read the enums on purpose: a value added to core without a migration that
  // lets the tables take it would lose every run that uses it.
  it.each(Object.values(Direction))('stores a quote in every direction core names: %s', async (direction) => {
    const run = buildFinishedRun({ quotes: [buildPricedQuoteSample({ direction })] });

    const outcome = await writeRun(testDatabase.database, run);

    expect(outcome).toBe('written');
  });

  it.each(Object.values(ReferenceState))('stores a run in every reference state core names: %s', async (state) => {
    const run = buildFinishedRun({ referenceState: state });

    const outcome = await writeRun(testDatabase.database, run);

    expect(outcome).toBe('written');
  });
});
