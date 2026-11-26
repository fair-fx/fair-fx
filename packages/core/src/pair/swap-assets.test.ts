import { Direction, swapAssets } from '@fair-fx/core';
import { buildPair, EURC, USDC } from '@fair-fx/core/testing';

describe('swapAssets', () => {
  it.each([
    { direction: Direction.BaseToQuote, assets: { input: USDC, output: EURC } },
    { direction: Direction.QuoteToBase, assets: { input: EURC, output: USDC } },
  ])('spends and receives the right token for $direction', ({ direction, assets }) => {
    const pair = buildPair();

    const swap = swapAssets(pair, direction);

    expect(swap).toEqual(assets);
  });
});
