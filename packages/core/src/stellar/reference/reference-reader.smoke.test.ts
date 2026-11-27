import { fileURLToPath } from 'node:url';
import { Fiat, Network, ReferenceStatus } from '@fair-fx/core';
import { loadConfig, readEnv } from '@fair-fx/core/node';
import { readReference, sorobanReferenceFeed } from '@fair-fx/core/stellar';
import { buildNetworkConfig } from '@fair-fx/core/testing';

// Reads the live feeds, so it needs the network: FAIRFX_SMOKE=1 pnpm --filter @fair-fx/core test smoke
const SMOKE = readEnv('FAIRFX_SMOKE') === '1';
const CONFIG_DIR = fileURLToPath(new URL('../../../../../config', import.meta.url));

// From TDD docs/reference-rates.md §1. `config/networks.json` gets its testnet entry with the testnet deploy.
const TESTNET = {
  rpcUrl: 'https://soroban-testnet.stellar.org',
  passphrase: 'Test SDF Network ; September 2015',
  reflectorFiatFeed: 'CCSSOHTBL3LEWUCBBEB5NJFC2OKFRC74OWEIJIZLRJBGAAU4VMU5NV4W',
  // A simulation only needs a well-formed account ID. The account does not have to exist on testnet.
  simulationSource: buildNetworkConfig().simulationSource,
};

describe.skipIf(!SMOKE)('the live Reflector fiat feed', () => {
  // EUR has traded between 0.82 and 1.60 USD since 1999. A price outside 0.5 to 2 is not EUR/USD.
  const plausibleEurReading = {
    status: ReferenceStatus.Ok,
    fiat: Fiat.Eur,
    price: expect.toSatisfy((price: bigint) => price > 50_000_000_000_000n && price < 200_000_000_000_000n),
    decimals: 14,
    oracleTime: expect.any(Number),
  };

  it('holds a plausible EUR price on mainnet, at the addresses in config/', async () => {
    const { endpoints } = await loadConfig(CONFIG_DIR, Network.Mainnet);

    const reading = await readReference(sorobanReferenceFeed(endpoints), Fiat.Eur);

    expect(reading).toEqual(plausibleEurReading);
  });

  it('holds a plausible EUR price on testnet', async () => {
    const feed = sorobanReferenceFeed(TESTNET);

    const reading = await readReference(feed, Fiat.Eur);

    expect(reading).toEqual(plausibleEurReading);
  });
});
