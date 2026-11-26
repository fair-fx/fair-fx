import { Direction, NoRouteCause, QuoteErrorCause, QuoteStatus } from '@fair-fx/core';
import { buildNetworkConfig, buildPair } from '@fair-fx/core/testing';
import { sdexAdapter, type Fetch } from '@fair-fx/venues';
import { fetchThatNeverAnswers, horizonAnswering } from '@fair-fx/venues/testing';

const NETWORK = buildNetworkConfig();
const PAIR = buildPair(); // USDC/EURC
const HUNDRED_USDC = 1_000_000_000n;

describe('sdexAdapter', () => {
  it('quotes 100 USDC to EURC from a recorded answer', async () => {
    const fetch = await horizonAnswering('strict-send.usdc-eurc.100', { latestLedger: 65_680_158 });
    const sdex = sdexAdapter(NETWORK, { fetch });

    const quote = await sdex.quote(PAIR, Direction.BaseToQuote, HUNDRED_USDC);

    expect(quote).toEqual({
      status: QuoteStatus.Ok,
      amountOut: 918_509_809n, // 91.8509809 EURC
      route: { path: [] },
      ledger: 65_680_158,
    });
  });

  it('quotes 100,000 EURC to USDC from a recorded answer', async () => {
    const fetch = await horizonAnswering('strict-send.eurc-usdc.100000');
    const sdex = sdexAdapter(NETWORK, { fetch });

    const quote = await sdex.quote(PAIR, Direction.QuoteToBase, 1_000_000_000_000n);

    expect(quote).toMatchObject({ status: QuoteStatus.Ok, amountOut: 1_082_252_160_754n }); // 108,225.2160754 USDC
  });

  it('takes the better of two recorded paths, the one through XLM', async () => {
    const fetch = await horizonAnswering('strict-send.usdc-eurc.two-paths');
    const sdex = sdexAdapter(NETWORK, { fetch });

    const quote = await sdex.quote(PAIR, Direction.BaseToQuote, 1_000_000_000_000_000_000n);

    expect(quote).toMatchObject({ amountOut: 198_417_316_833n, route: { path: ['native'] } }); // 19,841.7316833 EURC
  });

  it.each([
    {
      direction: Direction.BaseToQuote,
      source: 'USDC',
      destination: 'EURC:GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2',
    },
    {
      direction: Direction.QuoteToBase,
      source: 'EURC',
      destination: 'USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
    },
  ])('asks Horizon to send $source for $direction', async ({ direction, source, destination }) => {
    const fetch = await horizonAnswering('strict-send.no-route');
    const sdex = sdexAdapter(NETWORK, { fetch });

    await sdex.quote(PAIR, direction, HUNDRED_USDC);

    const url = new URL(String(fetch.mock.lastCall?.[0]));
    expect(url.searchParams.get('source_asset_code')).toBe(source);
    expect(url.searchParams.get('destination_assets')).toBe(destination);
  });

  it('returns no_route from a recorded answer with no path', async () => {
    const fetch = await horizonAnswering('strict-send.no-route');
    const sdex = sdexAdapter(NETWORK, { fetch });

    const quote = await sdex.quote(PAIR, Direction.BaseToQuote, HUNDRED_USDC);

    expect(quote).toEqual({ status: QuoteStatus.NoRoute, cause: NoRouteCause.NoPath });
  });

  it('returns an error with the reason Horizon gave for a recorded 400', async () => {
    const fetch = await horizonAnswering('strict-send.bad-request', { status: 400 });
    const sdex = sdexAdapter(NETWORK, { fetch });

    const quote = await sdex.quote(PAIR, Direction.BaseToQuote, HUNDRED_USDC);

    expect(quote).toEqual({
      status: QuoteStatus.Error,
      cause: QuoteErrorCause.Rejected,
      reason: 'horizon answered 400: Bad Request (Amount must be positive)',
    });
  });

  it('returns an error, and does not throw, when Horizon takes longer than the timeout', async () => {
    const sdex = sdexAdapter(NETWORK, { fetch: fetchThatNeverAnswers, timeoutMs: 1 });

    const quote = await sdex.quote(PAIR, Direction.BaseToQuote, HUNDRED_USDC);

    expect(quote).toEqual({
      status: QuoteStatus.Error,
      cause: QuoteErrorCause.Timeout,
      reason: 'timed out after 1 ms',
    });
  });

  it('returns an error with the cause when the request fails', async () => {
    const fetchFailed = new TypeError('fetch failed', { cause: new Error('getaddrinfo ENOTFOUND horizon.invalid') });
    const fetch = vi.fn<Fetch>().mockRejectedValue(fetchFailed);
    const sdex = sdexAdapter(NETWORK, { fetch });

    const quote = await sdex.quote(PAIR, Direction.BaseToQuote, HUNDRED_USDC);

    expect(quote).toEqual({
      status: QuoteStatus.Error,
      cause: QuoteErrorCause.Network,
      reason: 'fetch failed: getaddrinfo ENOTFOUND horizon.invalid',
    });
  });

  it('returns an error of an unknown kind when fetch rejects with something that is not a TypeError', async () => {
    const fetch = vi.fn<Fetch>().mockRejectedValue(new Error('socket hang up'));
    const sdex = sdexAdapter(NETWORK, { fetch });

    const quote = await sdex.quote(PAIR, Direction.BaseToQuote, HUNDRED_USDC);

    expect(quote).toEqual({ status: QuoteStatus.Error, cause: QuoteErrorCause.Unknown, reason: 'socket hang up' });
  });

  it('returns an error for an HTML error page', async () => {
    const fetch = vi.fn<Fetch>().mockResolvedValue(new Response('<html>Bad Gateway</html>', { status: 502 }));
    const sdex = sdexAdapter(NETWORK, { fetch });

    const quote = await sdex.quote(PAIR, Direction.BaseToQuote, HUNDRED_USDC);

    expect(quote).toEqual({
      status: QuoteStatus.Error,
      cause: QuoteErrorCause.Unavailable,
      reason: 'horizon answered 502',
    });
  });

  it('refuses an amount of zero without calling Horizon', async () => {
    const fetch = vi.fn<Fetch>();
    const sdex = sdexAdapter(NETWORK, { fetch });

    const quote = await sdex.quote(PAIR, Direction.BaseToQuote, 0n);

    expect(quote).toEqual({
      status: QuoteStatus.Error,
      cause: QuoteErrorCause.BadRequest,
      reason: 'expected an amount in above zero, got 0',
    });
    expect(fetch).not.toHaveBeenCalled();
  });
});
