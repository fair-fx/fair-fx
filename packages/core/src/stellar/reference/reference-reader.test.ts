import { Fiat, ReferenceStatus } from '@fair-fx/core';
import { readReference } from '@fair-fx/core/stellar';
import { buildReferenceFeed } from '@fair-fx/core/testing';

describe('readReference', () => {
  it('returns the price the feed holds for the currency', async () => {
    const feed = buildReferenceFeed();

    const reading = await readReference(feed, Fiat.Eur);

    expect(reading).toEqual({
      status: ReferenceStatus.Ok,
      fiat: Fiat.Eur,
      price: 109_531_321_156_430n, // 1.0953 USD
      decimals: 14,
      oracleTime: 1_795_683_300, // Unix seconds: 2026-11-26 08:55:00 UTC
    });
  });

  it('returns missing when the feed has no price for the currency', async () => {
    const feed = buildReferenceFeed({ lastPrice: () => Promise.resolve(null) });

    const reading = await readReference(feed, Fiat.Eur);

    expect(reading).toEqual({ status: ReferenceStatus.Missing, fiat: Fiat.Eur });
  });

  const fetchFailed = new Error('fetch failed', { cause: new Error('getaddrinfo ENOTFOUND rpc.invalid') });

  it.each([
    { call: 'decimals', feed: buildReferenceFeed({ decimals: () => Promise.reject(fetchFailed) }) },
    { call: 'lastprice', feed: buildReferenceFeed({ lastPrice: () => Promise.reject(fetchFailed) }) },
  ])('returns unavailable with the reason and its cause when the $call call fails', async ({ feed }) => {
    const reading = await readReference(feed, Fiat.Eur);

    expect(reading).toEqual({
      status: ReferenceStatus.Unavailable,
      fiat: Fiat.Eur,
      reason: 'fetch failed: getaddrinfo ENOTFOUND rpc.invalid',
    });
  });

  it('prices USD without calling the feed', async () => {
    const decimals = vi.fn();
    const lastPrice = vi.fn();

    const reading = await readReference({ decimals, lastPrice }, Fiat.Usd);

    expect(reading).toMatchObject({ status: ReferenceStatus.Ok, fiat: Fiat.Usd, price: 100_000_000_000_000n }); // 1 USD
    expect(decimals).not.toHaveBeenCalled();
    expect(lastPrice).not.toHaveBeenCalled();
  });
});
