import { failureLogLine, LogEvent, runLogLine, runOnce, writeLogLine } from '@fair-fx/collector';
import { buildCollectorPlan, buildCollectorPorts, buildVenueAdapter } from '@fair-fx/collector/testing';
import { NoRouteCause, QuoteErrorCause, QuoteStatus, VenueId } from '@fair-fx/core';
import { buildLedgerSource, buildReferenceFeed } from '@fair-fx/core/testing';
import { WriteRunOutcome } from '@fair-fx/db/writes';

describe('runLogLine', () => {
  it('reports the ledger clock, the age of each price and how each venue answered', async () => {
    const noRoute = buildVenueAdapter({
      id: VenueId.Aquarius,
      quote: () => Promise.resolve({ status: QuoteStatus.NoRoute, cause: NoRouteCause.NoPath }),
    });
    const ports = buildCollectorPorts({ venues: [buildVenueAdapter(), noRoute] });
    const report = await runOnce(ports, buildCollectorPlan());

    const line = runLogLine(report);

    expect(line).toEqual({
      event: 'run',
      slot: '2026-11-27T04:40:00.000Z',
      startedAt: '2026-11-27T04:43:41.000Z',
      finishedAt: '2026-11-27T04:43:41.000Z',
      outcome: 'written',
      referenceState: 'fresh',
      clock: { status: 'usable', sequence: 65_693_709, closeTime: 1_795_754_616, skewMilliseconds: -5_000 },
      references: [
        { fiat: 'USD', status: 'ok', oracleTime: null, ageSeconds: null },
        { fiat: 'EUR', status: 'ok', oracleTime: 1_795_754_556, ageSeconds: 60 },
      ],
      quotes: { sdex: { ok: 4 }, aquarius: { 'no_route:no_path': 4 } },
      shortfalls: 4,
    });
  });

  it('reports why the run is unknown when the ledger could not be read and a price failed', async () => {
    const timeout = { status: QuoteStatus.Error as const, cause: QuoteErrorCause.Timeout, reason: 'no answer' };
    const ports = buildCollectorPorts({
      venues: [buildVenueAdapter(), buildVenueAdapter({ id: VenueId.Soroswap, quote: () => Promise.resolve(timeout) })],
      feed: buildReferenceFeed({ lastPrice: () => Promise.reject(new Error('simulation failed')) }),
      ledger: buildLedgerSource({ latestLedger: () => Promise.reject(new Error('fetch failed')) }),
    });
    const report = await runOnce(ports, buildCollectorPlan());

    const line = runLogLine(report);

    expect(line).toMatchObject({
      referenceState: 'unknown',
      clock: { status: 'unreadable', failure: { status: 'unavailable', reason: 'fetch failed' } },
      references: [
        { fiat: 'USD', status: 'ok', ageSeconds: null },
        { fiat: 'EUR', status: 'unavailable', reason: 'simulation failed' },
      ],
      quotes: { sdex: { ok: 4 }, soroswap: { 'error:timeout': 4 } },
      shortfalls: 0,
    });
  });

  it('reports a run that found its slot taken', async () => {
    const ports = buildCollectorPorts({ store: () => Promise.resolve(WriteRunOutcome.SlotTaken) });
    const report = await runOnce(ports, buildCollectorPlan());

    const line = runLogLine(report);

    expect(line.outcome).toBe('slot_taken');
  });
});

describe('writeLogLine', () => {
  it('writes a run as one line of JSON that reads back as the same line', async () => {
    const report = await runOnce(buildCollectorPorts(), buildCollectorPlan());
    const line = runLogLine(report);
    const chunks: string[] = [];

    writeLogLine({ write: (chunk: string) => chunks.push(chunk) }, line);

    expect(chunks).toHaveLength(1);
    const [chunk = ''] = chunks;
    expect(chunk.indexOf('\n')).toBe(chunk.length - 1);
    expect(JSON.parse(chunk)).toEqual(line);
  });

  it('writes a failure with the message of its cause', () => {
    const chunks: string[] = [];
    const error = new Error('write run failed', { cause: new Error('connect ECONNREFUSED 127.0.0.1:5433') });

    writeLogLine({ write: (chunk: string) => chunks.push(chunk) }, failureLogLine(LogEvent.RunFailed, error));

    expect(chunks).toEqual([
      '{"event":"run_failed","reason":"write run failed: connect ECONNREFUSED 127.0.0.1:5433"}\n',
    ]);
  });
});
