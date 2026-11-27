import { ladderAmounts } from '@fair-fx/collector';
import { Direction } from '@fair-fx/core';
import { buildPair, EURC, USDC } from '@fair-fx/core/testing';

describe('ladderAmounts', () => {
  it.each([
    { input: 'base', direction: Direction.BaseToQuote, amounts: [1_000_000_000n, 2_500_000_000n] },
    { input: 'quote', direction: Direction.QuoteToBase, amounts: [10_000n, 25_000n] },
  ])('scales each rung by the decimals of the $input token for $direction', ({ direction, amounts }) => {
    const pair = buildPair({ base: { ...USDC, decimals: 7 }, quote: { ...EURC, decimals: 2 } });

    const scaled = ladderAmounts([100n, 250n], pair, direction);

    expect(scaled).toEqual(amounts);
  });
});
