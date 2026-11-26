import { Direction, NoRouteCause, QuoteErrorCause, QuoteStatus } from '@fair-fx/core';
import { buildNetworkConfig, buildPair } from '@fair-fx/core/testing';
import { aquariusAdapter, type Fetch } from '@fair-fx/venues';
import { aquariusAnswering, fetchThatNeverAnswers } from '@fair-fx/venues/testing';

const NETWORK = buildNetworkConfig();
const PAIR = buildPair(); // USDC/EURC
const HUNDRED_USDC = 1_000_000_000n;

const USDC = 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75';
const EURC = 'CDTKPWPLOURQA2SGTKTUQOWRCBZEORB4BWBOMJ3D3ZTQQSGE5F6JBQLV';
const SUSD = 'CDFZUVS5YNLXU7VENKOUDEOHCJGKQNVUBWD7KMN6E7ZROKPYPFLRUJFG';

describe('aquariusAdapter', () => {
  it('quotes 100 USDC to EURC from a recorded answer, a path of two pools through sUSD', async () => {
    const fetch = await aquariusAnswering('find-path.usdc-eurc.100');
    const aquarius = aquariusAdapter(NETWORK, { fetch });

    const quote = await aquarius.quote(PAIR, Direction.BaseToQuote, HUNDRED_USDC);

    expect(quote).toEqual({
      status: QuoteStatus.Ok,
      amountOut: 919_252_118n, // 91.9252118 EURC
      route: {
        swapChainXdr: expect.stringMatching(/^AAAAEAAAAAEAAAAC[A-Za-z0-9+/]+=$/),
        pools: [
          'CDD3OQDUVL3ITL4ZJF27WVSO65PFEQQ5AOHEUPUHC7YNL7VUYM4QRLZ5',
          'CCPN4NNSQKL3LLPTSPTFKYKXR3FBL37AULE6PTZH3QD24MPHXQCN5O3U',
        ],
        tokens: [USDC, SUSD, EURC],
      },
      ledger: null,
    });
  });

  it('quotes 100,000 EURC to USDC from a recorded answer', async () => {
    const fetch = await aquariusAnswering('find-path.eurc-usdc.100000');
    const aquarius = aquariusAdapter(NETWORK, { fetch });

    const quote = await aquarius.quote(PAIR, Direction.QuoteToBase, 1_000_000_000_000n);

    // 26,793.0385595 USDC: the pools are small, so an amount this large moves their price a long way.
    expect(quote).toMatchObject({ amountOut: 267_930_385_595n, route: { tokens: [EURC, SUSD, USDC] } });
  });

  it('quotes the estimate, not the lower bound, from a recorded answer to a request with slippage', async () => {
    const fetch = await aquariusAnswering('find-path.usdc-eurc.100.slippage');
    const aquarius = aquariusAdapter(NETWORK, { fetch });

    const quote = await aquarius.quote(PAIR, Direction.BaseToQuote, HUNDRED_USDC);

    // The request allows 1 percent: `amount` is 919252118 and `amount_with_fee` is 910059596.
    expect(quote).toMatchObject({ status: QuoteStatus.Ok, amountOut: 919_252_118n });
  });

  it('quotes from a recorded answer of the endpoint asked before, which sends amounts as decimal strings', async () => {
    const fetch = await aquariusAnswering('find-path.pools.usdc-eurc.100');
    const aquarius = aquariusAdapter(NETWORK, { fetch });

    const quote = await aquarius.quote(PAIR, Direction.BaseToQuote, HUNDRED_USDC);

    // Sent as "918572852.000000000000000000".
    expect(quote).toMatchObject({ status: QuoteStatus.Ok, amountOut: 918_572_852n });
  });

  it.each([
    { direction: Direction.BaseToQuote, input: 'USDC', tokenIn: USDC, tokenOut: EURC },
    { direction: Direction.QuoteToBase, input: 'EURC', tokenIn: EURC, tokenOut: USDC },
  ])('posts the two contracts and the amount of $input for $direction', async ({ direction, tokenIn, tokenOut }) => {
    const fetch = await aquariusAnswering('find-path.usdc-eurc.1-stroop');
    const aquarius = aquariusAdapter(NETWORK, { fetch });

    await aquarius.quote(PAIR, direction, HUNDRED_USDC);

    const [url, init] = fetch.mock.lastCall ?? [];
    expect(String(url)).toBe('https://amm-api.aqua.network/api/external/v2/find-path/');
    expect(init?.method).toBe('POST');
    expect(new Headers(init?.headers).get('content-type')).toBe('application/json');
    expect(JSON.parse(String(init?.body))).toEqual({
      token_in_address: tokenIn,
      token_out_address: tokenOut,
      amount: '1000000000',
    });
  });

  it('returns no_route as no path from a recorded answer for 1 stroop, which Aquarius does not tell from a missing pool', async () => {
    const fetch = await aquariusAnswering('find-path.usdc-eurc.1-stroop');
    const aquarius = aquariusAdapter(NETWORK, { fetch });

    const quote = await aquarius.quote(PAIR, Direction.BaseToQuote, 1n);

    expect(quote).toEqual({ status: QuoteStatus.NoRoute, cause: NoRouteCause.NoPath });
  });

  it('returns no_route from a recorded 400 that says Aquarius lists no such token', async () => {
    const fetch = await aquariusAnswering('find-path.unknown-token', { status: 400 });
    const aquarius = aquariusAdapter(NETWORK, { fetch });

    const quote = await aquarius.quote(PAIR, Direction.BaseToQuote, HUNDRED_USDC);

    expect(quote).toEqual({ status: QuoteStatus.NoRoute, cause: NoRouteCause.UnlistedToken });
  });

  it('returns an error with what Aquarius said in a recorded 400 for a request that names one token', async () => {
    const fetch = await aquariusAnswering('find-path.missing-token', { status: 400 });
    const aquarius = aquariusAdapter(NETWORK, { fetch });

    const quote = await aquarius.quote(PAIR, Direction.BaseToQuote, HUNDRED_USDC);

    expect(quote).toEqual({
      status: QuoteStatus.Error,
      cause: QuoteErrorCause.Rejected,
      reason: 'aquarius answered 400: token_out_address: This field is required.',
    });
  });

  it('returns an error, and does not throw, when Aquarius takes longer than the timeout', async () => {
    const aquarius = aquariusAdapter(NETWORK, { fetch: fetchThatNeverAnswers, timeoutMs: 1 });

    const quote = await aquarius.quote(PAIR, Direction.BaseToQuote, HUNDRED_USDC);

    expect(quote).toEqual({
      status: QuoteStatus.Error,
      cause: QuoteErrorCause.Timeout,
      reason: 'timed out after 1 ms',
    });
  });

  it('returns an error for an HTML error page', async () => {
    const fetch = vi.fn<Fetch>().mockResolvedValue(new Response('<html>Bad Gateway</html>', { status: 502 }));
    const aquarius = aquariusAdapter(NETWORK, { fetch });

    const quote = await aquarius.quote(PAIR, Direction.BaseToQuote, HUNDRED_USDC);

    expect(quote).toEqual({
      status: QuoteStatus.Error,
      cause: QuoteErrorCause.Unavailable,
      reason: 'aquarius answered 502',
    });
  });
});
