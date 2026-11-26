import { fileURLToPath } from 'node:url';
import { Direction, Network, QuoteStatus } from '@fair-fx/core';
import { loadConfig, readEnv } from '@fair-fx/core/node';
import { sdexAdapter } from '@fair-fx/venues';

// Calls the live Horizon, so it needs the network: FAIRFX_SMOKE=1 pnpm --filter @fair-fx/venues test smoke
const SMOKE = readEnv('FAIRFX_SMOKE') === '1';
const CONFIG_DIR = fileURLToPath(new URL('../../../../config', import.meta.url));

describe.skipIf(!SMOKE)('the live Horizon', () => {
  it('quotes 100 USDC to EURC on mainnet, at the addresses in config/', async () => {
    const config = await loadConfig(CONFIG_DIR, Network.Mainnet);
    const usdcEurc = config.pairs.find((pair) => pair.id === 'USDC/EURC');
    assert(usdcEurc, 'config/pairs.json has no USDC/EURC pair on mainnet');
    const sdex = sdexAdapter(config.endpoints);

    const quote = await sdex.quote(usdcEurc, Direction.BaseToQuote, 1_000_000_000n);

    // EUR has traded between 0.82 and 1.60 USD since 1999, so 100 USDC pays between 50 and 200 EURC.
    expect(quote).toEqual({
      status: QuoteStatus.Ok,
      amountOut: expect.toSatisfy((amount: bigint) => amount > 500_000_000n && amount < 2_000_000_000n),
      route: { path: expect.any(Array) },
      ledger: expect.any(Number),
    });
  });
});
