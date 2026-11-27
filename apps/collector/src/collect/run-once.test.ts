import { runOnce } from '@fair-fx/collector';
import { buildCollectorPlan, buildCollectorPorts, buildVenueAdapter } from '@fair-fx/collector/testing';
import { NoRouteCause, QuoteErrorCause, QuoteStatus, VenueId } from '@fair-fx/core';
import { buildLedgerSource, buildReferenceFeed, LADDER_UNITS, LATEST_LEDGER_ANSWER } from '@fair-fx/core/testing';
import { openMigratedDatabase, readStored, type TestDatabase } from '@fair-fx/db/testing';
import { writeRun } from '@fair-fx/db/writes';

describe('runOnce on Postgres', () => {
  let testDatabase: TestDatabase;

  beforeEach(async () => {
    testDatabase = await openMigratedDatabase();
  });

  afterEach(() => testDatabase.database.end());

  // SDEX pays, Soroswap times out on every quote, Aquarius has no route: 1 pair, 2 ways, 10 rungs.
  const portsWritingTo = (target: TestDatabase) =>
    buildCollectorPorts({
      venues: [
        buildVenueAdapter(),
        buildVenueAdapter({
          id: VenueId.Soroswap,
          quote: () =>
            Promise.resolve({ status: QuoteStatus.Error, cause: QuoteErrorCause.Timeout, reason: 'no answer' }),
        }),
        buildVenueAdapter({
          id: VenueId.Aquarius,
          quote: () => Promise.resolve({ status: QuoteStatus.NoRoute, cause: NoRouteCause.NoPath }),
        }),
      ],
      store: (run) => writeRun(target.database, run),
    });
  const plan = buildCollectorPlan({ ladder: LADDER_UNITS.map(BigInt) });

  it('stores a run with its ledger, one EUR price and 60 quotes, when one venue fails every quote', async () => {
    const report = await runOnce(portsWritingTo(testDatabase), plan);

    const stored = await readStored(testDatabase.database);
    const statuses = stored.quotes.map((row) => {
      const { venue, status, shortfall_bps: bps } = row as { venue: string; status: string; shortfall_bps: unknown };

      return `${venue} ${status} ${bps === null ? 'no shortfall' : 'shortfall'}`;
    });
    expect(report.outcome).toBe('written');
    expect(stored.runs).toEqual([
      expect.objectContaining({
        slot: new Date('2026-11-27T04:40:00.000Z'),
        started_at: new Date('2026-11-27T04:43:41.000Z'),
        ledger: '65693709',
        reference_state: 'fresh',
      }),
    ]);
    expect(stored.references).toEqual([
      expect.objectContaining({ symbol: 'EUR', status: 'ok', oracle_time: new Date('2026-11-27T04:42:36.000Z') }),
    ]);
    expect(stored.quotes).toHaveLength(60);
    expect(new Set(statuses)).toEqual(
      new Set(['sdex ok shortfall', 'soroswap error no shortfall', 'aquarius no_route no shortfall']),
    );
  });

  it('stores a closed run, with its shortfalls, when the latest ledger closed on a Saturday', async () => {
    // Saturday 2026-11-28 12:00:00 UTC, with an EUR price set 60 seconds earlier.
    const ports = buildCollectorPorts({
      feed: buildReferenceFeed({
        lastPrice: () => Promise.resolve({ price: 109_531_321_156_430n, timestamp: 1_795_867_140n }),
      }),
      ledger: buildLedgerSource({
        latestLedger: () => Promise.resolve({ ...LATEST_LEDGER_ANSWER, closeTime: '1795867200' }),
      }),
      now: () => new Date('2026-11-28T12:00:05.000Z'),
      store: (run) => writeRun(testDatabase.database, run),
    });

    await runOnce(ports, buildCollectorPlan());

    const stored = await readStored(testDatabase.database);
    expect(stored.runs).toEqual([expect.objectContaining({ reference_state: 'closed' })]);
    expect(stored.quotes).toEqual(Array(4).fill(expect.objectContaining({ shortfall_source: 'reflector_fx' })));
  });

  it('stores nothing more when a second run starts in the same slot', async () => {
    await runOnce(portsWritingTo(testDatabase), plan);
    const first = await readStored(testDatabase.database);

    const second = await runOnce(portsWritingTo(testDatabase), plan);

    expect(second.outcome).toBe('slot_taken');
    expect(await readStored(testDatabase.database)).toEqual(first);
  });
});
