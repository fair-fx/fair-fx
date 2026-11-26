import { QuoteErrorCause, QuoteStatus } from '@fair-fx/core';
import { toSoroswapQuote } from '@fair-fx/venues';

const PATH = [
  'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75',
  'CDTKPWPLOURQA2SGTKTUQOWRCBZEORB4BWBOMJ3D3ZTQQSGE5F6JBQLV',
];

describe('toSoroswapQuote', () => {
  it.each([
    { answer: 'one amount', value: [1_000_000_000n] },
    { answer: 'three amounts, a path through another token', value: [1_000_000_000n, 5n, 917_323_955n] },
    { answer: 'amounts as text', value: ['1000000000', '917323955'] },
    { answer: 'an amount out below zero', value: [1_000_000_000n, -1n] },
    { answer: 'no value', value: undefined },
  ])('returns an error for $answer', ({ value }) => {
    const quote = toSoroswapQuote({ value, ledger: 65_681_036 }, PATH);

    expect(quote).toEqual({
      status: QuoteStatus.Error,
      cause: QuoteErrorCause.BadAnswer,
      reason: expect.stringMatching(/^soroswap answer: /),
    });
  });
});
