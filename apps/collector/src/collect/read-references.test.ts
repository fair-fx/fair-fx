import { readReferences } from '@fair-fx/collector';
import { Fiat, ReferenceSource } from '@fair-fx/core';
import { buildPair, buildReferenceFeed, EUR_FEED_PRICE, EURC, USDC } from '@fair-fx/core/testing';

describe('readReferences', () => {
  it('reads every currency of the pairs once, and asks the feed only for the ones that are not its base', async () => {
    const asked: Fiat[] = [];
    const feed = buildReferenceFeed({
      lastPrice: (fiat) => {
        asked.push(fiat);

        return Promise.resolve(EUR_FEED_PRICE);
      },
    });
    // The first pair has no EUR side, so EUR is read only if every pair is looked at.
    const pairs = [
      buildPair({ id: 'USDC/USDC', quote: USDC }),
      buildPair(),
      buildPair({ id: 'EURC/USDC', base: EURC, quote: USDC }),
    ];

    const references = await readReferences(feed, ReferenceSource.ReflectorFx, pairs);

    expect(asked).toEqual(['EUR']);
    expect(references).toEqual({
      source: 'reflector_fx',
      readings: [
        { status: 'ok', fiat: 'USD', price: 100_000_000_000_000n, decimals: 14, oracleTime: null },
        { status: 'ok', fiat: 'EUR', price: 109_531_321_156_430n, decimals: 14, oracleTime: 1_795_683_300 },
      ],
    });
  });
});
