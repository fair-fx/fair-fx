import { Fiat, ReferenceSource, ReferenceState, ReferenceStatus } from '@fair-fx/core';
import {
  buildErrorQuoteSample,
  buildFinishedRun,
  buildNoRouteQuoteSample,
  buildPricedQuoteSample,
  buildReferenceSample,
  openMigratedDatabase,
  readStored,
  type TestDatabase,
} from '@fair-fx/db/testing';
import { writeRun } from '@fair-fx/db/writes';

describe('writeRun', () => {
  let testDatabase: TestDatabase;

  beforeEach(async () => {
    testDatabase = await openMigratedDatabase();
  });

  afterEach(() => testDatabase.database.end());

  it('stores a run with its reference and a quote of each status', async () => {
    const run = buildFinishedRun({
      quotes: [buildPricedQuoteSample(), buildNoRouteQuoteSample(), buildErrorQuoteSample()],
    });

    const outcome = await writeRun(testDatabase.database, run);

    const quote = { pair: 'USDC/EURC', direction: 'base_to_quote', amount_in: '1000000000' };
    const unpriced = { amount_out: null, shortfall_bps: null, shortfall_source: null, route: null, ledger: null };
    expect(outcome).toBe('written');
    expect(await readStored(testDatabase.database)).toEqual({
      runs: [
        {
          slot: new Date('2026-11-26T08:55:00.000Z'),
          started_at: new Date('2026-11-26T08:56:00.000Z'),
          finished_at: new Date('2026-11-26T08:56:12.000Z'),
          ledger: '65680158',
          reference_state: 'fresh',
        },
      ],
      references: [
        {
          source: 'reflector_fx',
          symbol: 'EUR',
          status: 'ok',
          price: '109531321156430',
          decimals: 14,
          oracle_time: new Date('2026-11-26T08:55:00.000Z'),
          reason: null,
        },
      ],
      quotes: [
        {
          ...quote,
          ...unpriced,
          venue: 'aquarius',
          status: 'error',
          cause: 'timeout',
          reason: 'no answer within 10000 ms',
          quoted_at: new Date('2026-11-26T08:56:11.000Z'),
        },
        {
          ...quote,
          venue: 'sdex',
          amount_out: '918509809',
          shortfall_bps: -60,
          shortfall_source: 'reflector_fx',
          route: { path: [] },
          status: 'ok',
          cause: null,
          reason: null,
          ledger: '65680158',
          quoted_at: new Date('2026-11-26T08:56:01.250Z'),
        },
        {
          ...quote,
          ...unpriced,
          venue: 'soroswap',
          status: 'no_route',
          cause: 'no_path',
          reason: null,
          quoted_at: new Date('2026-11-26T08:56:02.500Z'),
        },
      ],
    });
  });

  it.each([
    [{ status: ReferenceStatus.Missing, fiat: Fiat.Eur } as const, { status: 'missing', reason: null }],
    [
      { status: ReferenceStatus.Invalid, fiat: Fiat.Eur, reason: 'the price is not above zero' } as const,
      { status: 'invalid', reason: 'the price is not above zero' },
    ],
    [
      { status: ReferenceStatus.Unavailable, fiat: Fiat.Eur, reason: 'fetch failed' } as const,
      { status: 'unavailable', reason: 'fetch failed' },
    ],
  ])('stores a reference read that gave no price, with why: %o', async (reading, stored) => {
    const run = buildFinishedRun({
      referenceState: ReferenceState.Unknown,
      references: [buildReferenceSample({ source: ReferenceSource.ReflectorFx, reading })],
      quotes: [],
    });

    await writeRun(testDatabase.database, run);

    expect((await readStored(testDatabase.database)).references).toEqual([
      { source: 'reflector_fx', symbol: 'EUR', price: null, decimals: null, oracle_time: null, ...stored },
    ]);
  });

  it('stores a run that has no ledger, and a priced quote that has no shortfall or ledger', async () => {
    const quote = buildPricedQuoteSample().quote;
    const run = buildFinishedRun({
      ledger: null,
      referenceState: ReferenceState.Unknown,
      references: [],
      quotes: [buildPricedQuoteSample({ quote: { ...quote, ledger: null }, shortfall: null })],
    });

    await writeRun(testDatabase.database, run);

    const stored = await readStored(testDatabase.database);
    expect(stored.runs).toEqual([expect.objectContaining({ ledger: null, reference_state: 'unknown' })]);
    expect(stored.quotes).toEqual([
      expect.objectContaining({
        amount_out: '918509809',
        shortfall_bps: null,
        shortfall_source: null,
        ledger: null,
        status: 'ok',
      }),
    ]);
  });
});
