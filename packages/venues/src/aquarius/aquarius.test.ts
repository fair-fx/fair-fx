import { QuoteStatus } from '@fair-fx/core';
import { toAquariusQuote } from '@fair-fx/venues';
import { buildFindPathResponse, buildFoundPath } from '@fair-fx/venues/testing';

describe('toAquariusQuote', () => {
  it('keeps the swap chain, the pools and the token contracts as the route', () => {
    const response = buildFindPathResponse(buildFoundPath());

    const quote = toAquariusQuote(response);

    expect(quote).toEqual({
      status: QuoteStatus.Ok,
      amountOut: 918_572_852n, // 91.8572852 EURC
      route: {
        swapChainXdr: 'AAAAEAAAAAEAAAAA',
        pools: ['CBV6LZABOAJRXHLIEKILTWBPC2AXLYVR4CGGPKZQ3PWJ5QFTPIWSWGWQ'],
        tokens: [
          'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75',
          'CDTKPWPLOURQA2SGTKTUQOWRCBZEORB4BWBOMJ3D3ZTQQSGE5F6JBQLV',
        ],
      },
      ledger: null, // the API does not say which ledger it priced the path at
    });
  });

  it.each([
    {
      what: 'a decimal fraction, cut off and not rounded',
      amount: '904170985.900000000000000000',
      amountOut: 904_170_985n,
    },
    {
      what: 'more digits than a JSON number holds',
      amount: '9007199254740993.000000000000000000',
      amountOut: 9_007_199_254_740_993n,
    },
    {
      what: 'a JSON integer, as the documented endpoints send it',
      amount: 918_572_852,
      amountOut: 918_572_852n,
    },
  ])('reads an amount with $what', ({ amount, amountOut }) => {
    const response = buildFindPathResponse(buildFoundPath({ amount }));

    const quote = toAquariusQuote(response);

    expect(quote).toMatchObject({ status: QuoteStatus.Ok, amountOut });
  });

  it.each([
    { what: 'a path that pays nothing', body: buildFoundPath({ amount: '0.000000000000000000' }) },
    { what: 'no path, whatever the other fields hold', body: { success: false } },
  ])('returns no_route for $what', ({ body }) => {
    const response = buildFindPathResponse(body);

    const quote = toAquariusQuote(response);

    expect(quote).toEqual({ status: QuoteStatus.NoRoute });
  });

  it.each([
    // 2^53: JSON has already rounded a number this large, so its digits cannot be trusted.
    { what: 'a JSON number too large to be exact', body: buildFoundPath({ amount: 2 ** 53 }), names: '→ at amount' },
    { what: 'an amount below zero', body: buildFoundPath({ amount: '-5.000000000000000000' }), names: '→ at amount' },
    { what: 'an amount below zero as a JSON integer', body: buildFoundPath({ amount: -5 }), names: '→ at amount' },
    { what: 'an amount that is not a number', body: buildFoundPath({ amount: 'many' }), names: '→ at amount' },
    { what: 'an empty swap chain', body: buildFoundPath({ swap_chain_xdr: '' }), names: '→ at swap_chain_xdr' },
    {
      what: 'a body that does not say whether a path was found',
      body: { amount: '918572852.000000000000000000' },
      names: '→ at success',
    },
  ])('returns an error that names the field for $what', ({ body, names }) => {
    const response = buildFindPathResponse(body);

    const quote = toAquariusQuote(response);

    expect(quote).toEqual({ status: QuoteStatus.Error, reason: expect.stringContaining(names) });
  });

  it('returns an error for a body that is not JSON', () => {
    const response = buildFindPathResponse(null);

    const quote = toAquariusQuote(response);

    expect(quote).toEqual({ status: QuoteStatus.Error, reason: expect.stringMatching(/^aquarius response: /) });
  });

  it.each([
    {
      what: 'one reason as text, as Aquarius answers a GET',
      status: 405,
      body: { detail: 'Method "GET" not allowed.' },
      reason: 'aquarius answered 405: detail: Method "GET" not allowed.',
    },
    { what: 'no reason at all', status: 500, body: {}, reason: 'aquarius answered 500' },
  ])('returns an error for an HTTP error with $what', ({ status, body, reason }) => {
    const response = buildFindPathResponse(body, { status });

    const quote = toAquariusQuote(response);

    expect(quote).toEqual({ status: QuoteStatus.Error, reason });
  });
});
