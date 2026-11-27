import { finishRun, RunClockStatus } from '@fair-fx/collector';
import { buildLedgerClock, buildReferenceSet, buildRunReadings, buildTakenQuote } from '@fair-fx/collector/testing';
import { Fiat, LedgerStatus, NoRouteCause, QuoteErrorCause, QuoteStatus, ReferenceStatus } from '@fair-fx/core';
import { buildReferencePrice, WEEKEND_WINDOW } from '@fair-fx/core/testing';

const USD_READING = buildReferencePrice({ fiat: Fiat.Usd, price: 100_000_000_000_000n, oracleTime: null });

describe('finishRun', () => {
  it('stores a run with a fresh reference under its slot, with the shortfall of the quote that paid', () => {
    const readings = buildRunReadings();

    const run = finishRun(readings, WEEKEND_WINDOW);

    expect(run).toEqual({
      slot: new Date('2026-11-26T08:55:00.000Z'),
      startedAt: new Date('2026-11-26T08:56:00.000Z'),
      finishedAt: new Date('2026-11-26T08:56:12.000Z'),
      ledger: 65_680_158,
      referenceState: 'fresh',
      references: [
        {
          source: 'reflector_fx',
          reading: { status: 'ok', fiat: 'EUR', price: 109_531_321_156_430n, decimals: 14, oracleTime: 1_795_683_300 },
        },
      ],
      quotes: [
        {
          pair: 'USDC/EURC',
          direction: 'base_to_quote',
          venue: 'sdex',
          amountIn: 1_000_000_000n,
          quotedAt: new Date('2026-11-26T08:56:01.250Z'),
          quote: { status: 'ok', amountOut: 918_509_809n, route: { path: [] }, ledger: 65_680_158 },
          shortfall: { bps: -60n, source: 'reflector_fx' },
        },
      ],
    });
  });

  it('keeps the slot it started in when it finishes in the next one', () => {
    const readings = buildRunReadings({
      startedAt: new Date('2026-11-26T08:59:50.000Z'),
      finishedAt: new Date('2026-11-26T09:00:20.000Z'),
    });

    const run = finishRun(readings, WEEKEND_WINDOW);

    expect(run.slot).toEqual(new Date('2026-11-26T08:55:00.000Z'));
  });

  it('is closed, and still has a shortfall, when the ledger closed inside the closed window', () => {
    // Saturday 2026-11-28 12:00:00 UTC, with an EUR price set 60 seconds earlier.
    const readings = buildRunReadings({
      clock: buildLedgerClock({ closeTime: 1_795_867_200 }),
      references: buildReferenceSet({ readings: [USD_READING, buildReferencePrice({ oracleTime: 1_795_867_140 })] }),
    });

    const run = finishRun(readings, WEEKEND_WINDOW);

    expect(run).toMatchObject({ referenceState: 'closed', quotes: [{ shortfall: { bps: -60n } }] });
  });

  it.each([
    {
      what: 'the EUR price is 601 seconds older than the close time of the ledger',
      overrides: { clock: buildLedgerClock({ closeTime: 1_795_683_901 }) },
      ledger: 65_680_158,
    },
    {
      what: 'the close time of the ledger is too far from the clock of the collector',
      overrides: { clock: buildLedgerClock({ status: RunClockStatus.Skewed, skewMilliseconds: -31_000 }) },
      ledger: 65_680_158,
    },
    {
      what: 'the ledger could not be read',
      overrides: {
        clock: {
          status: RunClockStatus.Unreadable as const,
          failure: { status: LedgerStatus.Unavailable as const, reason: 'fetch failed' },
        },
      },
      ledger: null,
    },
  ])('is unknown, with no shortfall and every read stored, when $what', ({ overrides, ledger }) => {
    const readings = buildRunReadings(overrides);

    const run = finishRun(readings, WEEKEND_WINDOW);

    expect(run).toMatchObject({
      ledger,
      referenceState: 'unknown',
      references: [{ reading: { status: 'ok', fiat: 'EUR' } }],
      quotes: [{ quote: { status: 'ok' }, shortfall: null }],
    });
  });

  it('stores a failed read of a reference price with its reason', () => {
    const failure = { status: ReferenceStatus.Unavailable as const, fiat: Fiat.Eur, reason: 'fetch failed' };
    const readings = buildRunReadings({ references: buildReferenceSet({ readings: [USD_READING, failure] }) });

    const run = finishRun(readings, WEEKEND_WINDOW);

    expect(run.references).toEqual([
      { source: 'reflector_fx', reading: { status: 'unavailable', fiat: 'EUR', reason: 'fetch failed' } },
    ]);
  });

  it('stores a quote that did not pay as the venue answered it, without a shortfall', () => {
    const noRoute = { status: QuoteStatus.NoRoute as const, cause: NoRouteCause.NoPath };
    const timedOut = {
      status: QuoteStatus.Error as const,
      cause: QuoteErrorCause.Timeout,
      reason: 'no answer within 10000 ms',
    };
    const readings = buildRunReadings({
      quotes: [buildTakenQuote({ quote: noRoute }), buildTakenQuote({ quote: timedOut })],
    });

    const run = finishRun(readings, WEEKEND_WINDOW);

    expect(run.quotes).toEqual([
      {
        pair: 'USDC/EURC',
        direction: 'base_to_quote',
        venue: 'sdex',
        amountIn: 1_000_000_000n,
        quotedAt: new Date('2026-11-26T08:56:01.250Z'),
        quote: { status: 'no_route', cause: 'no_path' },
      },
      {
        pair: 'USDC/EURC',
        direction: 'base_to_quote',
        venue: 'sdex',
        amountIn: 1_000_000_000n,
        quotedAt: new Date('2026-11-26T08:56:01.250Z'),
        quote: { status: 'error', cause: 'timeout', reason: 'no answer within 10000 ms' },
      },
    ]);
  });
});
