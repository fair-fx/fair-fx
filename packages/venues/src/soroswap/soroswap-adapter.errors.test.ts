import { Direction, QuoteErrorCause, QuoteStatus } from '@fair-fx/core';
import { buildNetworkConfig, buildPair } from '@fair-fx/core/testing';
import { soroswapAdapter, type Fetch } from '@fair-fx/venues';
import { fetchThatNeverAnswers, sorobanRpcAnswering, sorobanRpcSaying } from '@fair-fx/venues/testing';

const NETWORK = buildNetworkConfig();
const PAIR = buildPair(); // USDC/EURC
const HUNDRED_USDC = 1_000_000_000n;

// The SDK's RPC client has no `fetch` option: it calls the global one, so each test replaces that.
describe('soroswapAdapter, when the quote cannot be read', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns an error when no contract is deployed at the router address', async () => {
    const notDeployed = 'CBOTBYBQC62LRQ2KZVBWRFMLYF6S3JML36Z2C2LI7ZRYXWRJLKAV47NY';
    const fetch = await sorobanRpcAnswering(
      'simulate.not-deployed.get-amounts-out',
      'simulate.not-deployed.get-factory',
    );
    vi.stubGlobal('fetch', fetch);
    const soroswap = soroswapAdapter({ ...NETWORK, soroswapRouter: notDeployed });

    const quote = await soroswap.quote(PAIR, Direction.BaseToQuote, HUNDRED_USDC);

    expect(quote).toEqual({
      status: QuoteStatus.Error,
      cause: QuoteErrorCause.Rejected,
      reason: `no Soroswap router answers at ${notDeployed}: HostError: Error(Storage, MissingValue)`,
    });
  });

  it('returns an error that blames the RPC node, not the router, when the second read cannot be made', async () => {
    const fetch = await sorobanRpcAnswering('simulate.soroswap.no-pair');
    fetch.mockResolvedValueOnce(new Response('<html>Bad Gateway</html>', { status: 502 }));
    vi.stubGlobal('fetch', fetch);
    const soroswap = soroswapAdapter(NETWORK);

    const quote = await soroswap.quote(PAIR, Direction.BaseToQuote, HUNDRED_USDC);

    expect(quote).toEqual({
      status: QuoteStatus.Error,
      cause: QuoteErrorCause.Unavailable,
      reason: 'Request failed with status code 502',
    });
  });

  it('returns an error from a recorded answer to an amount too large for the pool arithmetic', async () => {
    vi.stubGlobal('fetch', await sorobanRpcAnswering('simulate.soroswap.overflow'));
    const soroswap = soroswapAdapter(NETWORK);

    const quote = await soroswap.quote(PAIR, Direction.BaseToQuote, 10n ** 30n);

    expect(quote).toEqual({
      status: QuoteStatus.Error,
      cause: QuoteErrorCause.Rejected,
      reason: 'HostError: Error(WasmVm, InvalidAction)',
    });
  });

  it('returns an error, and does not throw, when the RPC node takes longer than the timeout', async () => {
    vi.stubGlobal('fetch', fetchThatNeverAnswers);
    const soroswap = soroswapAdapter(NETWORK, { timeoutMs: 1 });

    const quote = await soroswap.quote(PAIR, Direction.BaseToQuote, HUNDRED_USDC);

    expect(quote).toEqual({
      status: QuoteStatus.Error,
      cause: QuoteErrorCause.Timeout,
      reason: 'timeout of 1 ms exceeded',
    });
  });

  it('returns an error with the message of a JSON-RPC error', async () => {
    const refused = { jsonrpc: '2.0', id: 1, error: { code: -32602, message: 'invalid parameters' } };
    vi.stubGlobal('fetch', sorobanRpcSaying(refused));
    const soroswap = soroswapAdapter(NETWORK);

    const quote = await soroswap.quote(PAIR, Direction.BaseToQuote, HUNDRED_USDC);

    expect(quote).toEqual({ status: QuoteStatus.Error, cause: QuoteErrorCause.Rejected, reason: 'invalid parameters' });
  });

  it('returns an error for an HTML error page', async () => {
    vi.stubGlobal('fetch', vi.fn<Fetch>().mockResolvedValue(new Response('<html>Bad Gateway</html>', { status: 502 })));
    const soroswap = soroswapAdapter(NETWORK);

    const quote = await soroswap.quote(PAIR, Direction.BaseToQuote, HUNDRED_USDC);

    expect(quote).toEqual({
      status: QuoteStatus.Error,
      cause: QuoteErrorCause.Unavailable,
      reason: 'Request failed with status code 502',
    });
  });

  it('returns an error as rejected when the RPC node answers 401, as a node that wants a key does', async () => {
    vi.stubGlobal('fetch', vi.fn<Fetch>().mockResolvedValue(new Response('Unauthorized', { status: 401 })));
    const soroswap = soroswapAdapter(NETWORK);

    const quote = await soroswap.quote(PAIR, Direction.BaseToQuote, HUNDRED_USDC);

    expect(quote).toEqual({
      status: QuoteStatus.Error,
      cause: QuoteErrorCause.Rejected,
      reason: 'Request failed with status code 401',
    });
  });

  it('returns an error as a network failure, without the detail the SDK drops, when the RPC node cannot be reached', async () => {
    const fetchFailed = new TypeError('fetch failed', { cause: new Error('getaddrinfo ENOTFOUND rpc.invalid') });
    vi.stubGlobal('fetch', vi.fn<Fetch>().mockRejectedValue(fetchFailed));
    const soroswap = soroswapAdapter(NETWORK);

    const quote = await soroswap.quote(PAIR, Direction.BaseToQuote, HUNDRED_USDC);

    expect(quote).toEqual({ status: QuoteStatus.Error, cause: QuoteErrorCause.Network, reason: 'fetch failed' });
  });

  it('returns an error of an unknown kind for a 200 that is not JSON-RPC, which the SDK fails to read', async () => {
    vi.stubGlobal('fetch', vi.fn<Fetch>().mockResolvedValue(new Response('<html>hello</html>', { status: 200 })));
    const soroswap = soroswapAdapter(NETWORK);

    const quote = await soroswap.quote(PAIR, Direction.BaseToQuote, HUNDRED_USDC);

    expect(quote).toEqual({ status: QuoteStatus.Error, cause: QuoteErrorCause.Unknown, reason: expect.any(String) });
  });

  it('refuses an amount of zero without calling the RPC node', async () => {
    const fetch = vi.fn<Fetch>();
    vi.stubGlobal('fetch', fetch);
    const soroswap = soroswapAdapter(NETWORK);

    const quote = await soroswap.quote(PAIR, Direction.BaseToQuote, 0n);

    expect(quote).toEqual({
      status: QuoteStatus.Error,
      cause: QuoteErrorCause.BadRequest,
      reason: 'expected an amount in above zero, got 0',
    });
    expect(fetch).not.toHaveBeenCalled();
  });
});
