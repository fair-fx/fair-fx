import { quoteShortfall } from '@fair-fx/collector';
import { buildReferenceSet, buildTakenQuote } from '@fair-fx/collector/testing';
import { Direction, Fiat, ReferenceStatus } from '@fair-fx/core';
import { buildPair, buildReferencePrice, EURC } from '@fair-fx/core/testing';

const USD_READING = buildReferencePrice({ fiat: Fiat.Usd, price: 100_000_000_000_000n, oracleTime: null });
/** EUR at exactly 1 USD, so the reference output equals the amount in. */
const AT_PARITY = buildReferenceSet({
  readings: [USD_READING, buildReferencePrice({ fiat: Fiat.Eur, price: 100_000_000_000_000n })],
});
const EURC_WITH_2_DECIMALS = buildPair({ quote: { ...EURC, decimals: 2 } });

describe('quoteShortfall', () => {
  // EUR is 1.0953 USD: 100 USDC is worth 91.2980861 EURC, and 100 EURC is worth 109.5313211 USDC.
  it.each([
    {
      what: '100 USDC paying 91.8509809 EURC',
      taken: buildTakenQuote({ direction: Direction.BaseToQuote, amountIn: 1_000_000_000n }),
      amountOut: 918_509_809n,
      bps: -60n,
    },
    {
      what: '100 EURC paying 109 USDC',
      taken: buildTakenQuote({ direction: Direction.QuoteToBase, amountIn: 1_000_000_000n }),
      amountOut: 1_090_000_000n,
      bps: 49n,
    },
    {
      what: '100 USDC paying 91.00 of an EURC with 2 decimals',
      taken: buildTakenQuote({
        pair: EURC_WITH_2_DECIMALS,
        direction: Direction.BaseToQuote,
        amountIn: 1_000_000_000n,
      }),
      amountOut: 9_100n,
      bps: 32n,
    },
    {
      what: '100.00 of an EURC with 2 decimals paying 109 USDC',
      taken: buildTakenQuote({ pair: EURC_WITH_2_DECIMALS, direction: Direction.QuoteToBase, amountIn: 10_000n }),
      amountOut: 1_090_000_000n,
      bps: 49n,
    },
  ])('gives $bps bps for $what', ({ taken, amountOut, bps }) => {
    const references = buildReferenceSet();

    const shortfall = quoteShortfall(taken, amountOut, references);

    expect(shortfall).toEqual({ bps, source: 'reflector_fx' });
  });

  it.each([
    {
      what: 'a currency of the pair has no price',
      taken: buildTakenQuote(),
      references: buildReferenceSet({ readings: [USD_READING, { status: ReferenceStatus.Missing, fiat: Fiat.Eur }] }),
    },
    {
      what: 'the amount in is worth less than one smallest unit of the output token',
      taken: buildTakenQuote({ amountIn: 1n }),
      references: buildReferenceSet(),
    },
    {
      what: 'the rate math refuses the amount in',
      taken: buildTakenQuote({ amountIn: 10n ** 30n }),
      references: buildReferenceSet(),
    },
  ])('gives none when $what', ({ taken, references }) => {
    const shortfall = quoteShortfall(taken, 918_509_809n, references);

    expect(shortfall).toBeNull();
  });

  // A venue adapter never gives an amount out below zero. The rows that do show what the upper bound is for.
  it.each([
    { what: 'lowest', amountOut: 2_147_493_648n, bps: -2_147_483_648n },
    { what: 'highest', amountOut: -2_147_473_647n, bps: 2_147_483_647n },
  ])('gives the $what shortfall that fits 32 bits', ({ amountOut, bps }) => {
    const taken = buildTakenQuote({ amountIn: 10_000n });

    const shortfall = quoteShortfall(taken, amountOut, AT_PARITY);

    expect(shortfall).toEqual({ bps, source: 'reflector_fx' });
  });

  it.each([
    { what: 'one below the lowest', amountOut: 2_147_493_649n },
    { what: 'one above the highest', amountOut: -2_147_473_648n },
  ])('gives none for a shortfall $what that fits 32 bits', ({ amountOut }) => {
    const taken = buildTakenQuote({ amountIn: 10_000n });

    const shortfall = quoteShortfall(taken, amountOut, AT_PARITY);

    expect(shortfall).toBeNull();
  });
});
