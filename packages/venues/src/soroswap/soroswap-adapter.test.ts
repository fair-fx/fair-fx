import { Direction, QuoteStatus } from '@fair-fx/core';
import { buildNetworkConfig, buildPair } from '@fair-fx/core/testing';
import { soroswapAdapter } from '@fair-fx/venues';
import { buildFailedSimulation, simulatedCalls, sorobanRpcAnswering, sorobanRpcSaying } from '@fair-fx/venues/testing';

const NETWORK = buildNetworkConfig();
const PAIR = buildPair(); // USDC/EURC
const HUNDRED_USDC = 1_000_000_000n;

const ROUTER = 'CAG5LRYQ5JVEUI5TEID72EYOVX44TTUJT5BQR2J6J77FH65PCCFAJDDH';
const USDC = 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75';
const EURC = 'CDTKPWPLOURQA2SGTKTUQOWRCBZEORB4BWBOMJ3D3ZTQQSGE5F6JBQLV';

// The SDK's RPC client has no `fetch` option: it calls the global one, so each test replaces that.
describe('soroswapAdapter', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('quotes 100 USDC to EURC from a recorded answer', async () => {
    vi.stubGlobal('fetch', await sorobanRpcAnswering('simulate.soroswap.usdc-eurc.100'));
    const soroswap = soroswapAdapter(NETWORK);

    const quote = await soroswap.quote(PAIR, Direction.BaseToQuote, HUNDRED_USDC);

    expect(quote).toEqual({
      status: QuoteStatus.Ok,
      amountOut: 917_323_955n, // 91.7323955 EURC
      route: { path: [USDC, EURC] },
      ledger: 65_681_036,
    });
  });

  it('quotes 100,000 EURC to USDC from a recorded answer', async () => {
    vi.stubGlobal('fetch', await sorobanRpcAnswering('simulate.soroswap.eurc-usdc.100000'));
    const soroswap = soroswapAdapter(NETWORK);

    const quote = await soroswap.quote(PAIR, Direction.QuoteToBase, 1_000_000_000_000n);

    // 77,530.3511663 USDC: the pool is small, so an amount this large moves its price a long way.
    expect(quote).toMatchObject({ amountOut: 775_303_511_663n, route: { path: [EURC, USDC] } });
  });

  it.each([
    { direction: Direction.BaseToQuote, input: 'USDC', path: [{ address: USDC }, { address: EURC }] },
    { direction: Direction.QuoteToBase, input: 'EURC', path: [{ address: EURC }, { address: USDC }] },
  ])('asks the router what 100 $input pays for $direction', async ({ direction, path }) => {
    const fetch = await sorobanRpcAnswering('simulate.soroswap.usdc-eurc.100');
    vi.stubGlobal('fetch', fetch);
    const soroswap = soroswapAdapter(NETWORK);

    await soroswap.quote(PAIR, direction, HUNDRED_USDC);

    expect(simulatedCalls(fetch, NETWORK.passphrase)).toEqual([
      {
        contract_address: ROUTER,
        function_name: 'router_get_amounts_out',
        args: [{ i128: '1000000000' }, { vec: path }],
      },
    ]);
  });

  it('returns no_route from a recorded answer that pays nothing for 1 stroop', async () => {
    vi.stubGlobal('fetch', await sorobanRpcAnswering('simulate.soroswap.usdc-eurc.1-stroop'));
    const soroswap = soroswapAdapter(NETWORK);

    const quote = await soroswap.quote(PAIR, Direction.BaseToQuote, 1n);

    expect(quote).toEqual({ status: QuoteStatus.NoRoute });
  });

  it('returns no_route for a pair nobody created, once the router has answered another call', async () => {
    const fetch = await sorobanRpcAnswering('simulate.soroswap.no-pair', 'simulate.soroswap.get-factory');
    vi.stubGlobal('fetch', fetch);
    const soroswap = soroswapAdapter(NETWORK);

    const quote = await soroswap.quote(PAIR, Direction.BaseToQuote, HUNDRED_USDC);

    expect(quote).toEqual({ status: QuoteStatus.NoRoute });
    expect(simulatedCalls(fetch, NETWORK.passphrase)).toEqual([
      expect.objectContaining({ function_name: 'router_get_amounts_out' }),
      { contract_address: ROUTER, function_name: 'get_factory', args: [] },
    ]);
  });

  it('returns no_route when the router says the pool is empty', async () => {
    // Not recorded: no empty pool was found on mainnet. Error 511 is the router's `LibraryInsufficientLiquidity`.
    const fetch = sorobanRpcSaying(buildFailedSimulation('HostError: Error(Contract, #511)'));
    vi.stubGlobal('fetch', fetch);
    const soroswap = soroswapAdapter(NETWORK);

    const quote = await soroswap.quote(PAIR, Direction.BaseToQuote, HUNDRED_USDC);

    expect(quote).toEqual({ status: QuoteStatus.NoRoute });
    expect(fetch).toHaveBeenCalledOnce();
  });
});
