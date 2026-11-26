import { baseReference, Fiat, referenceAgeSeconds, ReferenceStatus, toReferenceReading } from '@fair-fx/core';
import { EUR_FEED_PRICE } from '@fair-fx/core/testing';

describe('toReferenceReading', () => {
  it('returns the price, its decimals and the oracle time in seconds', () => {
    const reading = toReferenceReading(Fiat.Eur, 14, EUR_FEED_PRICE);

    expect(reading).toEqual({
      status: ReferenceStatus.Ok,
      fiat: Fiat.Eur,
      price: 109_531_321_156_430n,
      decimals: 14,
      oracleTime: 1_795_683_300,
    });
  });

  it('returns missing when the feed has no price', () => {
    const reading = toReferenceReading(Fiat.Eur, 14, null);

    expect(reading).toEqual({ status: ReferenceStatus.Missing, fiat: Fiat.Eur });
  });

  it.each([
    { what: 'a feed with 13 decimals', decimals: 13, lastPrice: EUR_FEED_PRICE, reason: /^feed decimals: / },
    { what: 'a feed with 13 decimals and no price', decimals: 13, lastPrice: null, reason: /^feed decimals: / },
    { what: 'a zero price', decimals: 14, lastPrice: { ...EUR_FEED_PRICE, price: 0n }, reason: /^feed price: / },
    { what: 'a negative price', decimals: 14, lastPrice: { ...EUR_FEED_PRICE, price: -1n }, reason: /^feed price: / },
    { what: 'a price without a timestamp', decimals: 14, lastPrice: { price: 1n }, reason: /^feed price: / },
    { what: 'an answer that is not a price', decimals: 14, lastPrice: 'EUR', reason: /^feed price: / },
  ])('reports $what as invalid', ({ decimals, lastPrice, reason }) => {
    const reading = toReferenceReading(Fiat.Eur, decimals, lastPrice);

    expect(reading).toEqual({ status: ReferenceStatus.Invalid, fiat: Fiat.Eur, reason: expect.stringMatching(reason) });
  });
});

describe('baseReference', () => {
  it('prices USD at 10^14 with no oracle time', () => {
    const reference = baseReference();

    expect(reference).toEqual({
      status: ReferenceStatus.Ok,
      fiat: Fiat.Usd,
      price: 100_000_000_000_000n,
      decimals: 14,
      oracleTime: null,
    });
  });
});

describe('referenceAgeSeconds', () => {
  const eur = { ...baseReference(), fiat: Fiat.Eur, oracleTime: 1_795_683_300 };

  it.each([
    { what: 'a price set a day ago', now: 1_795_769_700, age: 86_400 },
    { what: 'a price set this second', now: 1_795_683_300, age: 0 },
    { what: 'a price dated after now', now: 1_795_683_299, age: 0 },
  ])('gives $age seconds for $what', ({ now, age }) => {
    const seconds = referenceAgeSeconds(eur, now);

    expect(seconds).toBe(age);
  });

  it('gives null for the base currency, which never ages', () => {
    const seconds = referenceAgeSeconds(baseReference(), 1_795_683_300);

    expect(seconds).toBeNull();
  });
});
