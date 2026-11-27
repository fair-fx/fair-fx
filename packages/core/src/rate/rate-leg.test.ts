import { Fiat, rateLeg, ReferenceStatus, type ReferenceReading } from '@fair-fx/core';
import { buildReferencePrice, EURC, USDC } from '@fair-fx/core/testing';

const USD_READING = buildReferencePrice({ fiat: Fiat.Usd, price: 100_000_000_000_000n, oracleTime: null });
const EUR_READING = buildReferencePrice({ fiat: Fiat.Eur, price: 109_531_321_156_430n });

describe('rateLeg', () => {
  it.each([
    { what: 'EUR price for an EUR token', asset: { ...EURC, decimals: 6 }, price: 109_531_321_156_430n, decimals: 6 },
    { what: 'USD price for a USD token', asset: USDC, price: 100_000_000_000_000n, decimals: 7 },
  ])('pairs the $what with the decimals of the token', ({ asset, price, decimals }) => {
    const readings = [USD_READING, EUR_READING];

    const leg = rateLeg(asset, readings);

    expect(leg).toEqual({ price, decimals });
  });

  it.each<{ what: string; readings: ReferenceReading[] }>([
    { what: 'was not read', readings: [USD_READING] },
    { what: 'is missing from the feed', readings: [USD_READING, { status: ReferenceStatus.Missing, fiat: Fiat.Eur }] },
    {
      what: 'could not be read',
      readings: [USD_READING, { status: ReferenceStatus.Unavailable, fiat: Fiat.Eur, reason: 'fetch failed' }],
    },
  ])('gives no leg when the price of the currency $what', ({ readings }) => {
    const leg = rateLeg(EURC, readings);

    expect(leg).toBeNull();
  });
});
