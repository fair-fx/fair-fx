import { collectRun } from '@fair-fx/collector';
import { buildCollectorPlan, buildCollectorPorts, tickingClock } from '@fair-fx/collector/testing';
import { buildLedgerSource, buildReferenceFeed, EUR_FEED_PRICE, LATEST_LEDGER_ANSWER } from '@fair-fx/core/testing';

describe('collectRun', () => {
  it('reads the latest ledger only after the reference prices have arrived', async () => {
    const events: string[] = [];
    const feed = buildReferenceFeed({
      lastPrice: async () => {
        await new Promise((resolve) => setImmediate(resolve));
        events.push('price');

        return EUR_FEED_PRICE;
      },
    });
    const ledger = buildLedgerSource({
      latestLedger: () => {
        events.push('ledger');

        return Promise.resolve(LATEST_LEDGER_ANSWER);
      },
    });

    await collectRun(buildCollectorPorts({ feed, ledger }), buildCollectorPlan());

    expect(events).toEqual(['price', 'ledger']);
  });

  it('starts with the first read of the collector clock and finishes with the last', async () => {
    // One venue and a ladder of 2: 4 quotes, so the clock is read 7 times.
    const ports = buildCollectorPorts({ now: tickingClock('2026-11-27T04:43:38.000Z') });

    const readings = await collectRun(ports, buildCollectorPlan());

    expect(readings).toMatchObject({
      startedAt: new Date('2026-11-27T04:43:38.000Z'),
      finishedAt: new Date('2026-11-27T04:43:44.000Z'),
      clock: { status: 'usable', sequence: 65_693_709 },
      references: { source: 'reflector_fx', readings: [{ fiat: 'USD' }, { fiat: 'EUR', oracleTime: 1_795_754_556 }] },
    });
    expect(readings.quotes).toHaveLength(4);
  });
});
