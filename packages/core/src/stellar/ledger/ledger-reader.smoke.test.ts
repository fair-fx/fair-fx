import { fileURLToPath } from 'node:url';
import { LedgerStatus, Network } from '@fair-fx/core';
import { loadConfig, readEnv } from '@fair-fx/core/node';
import { readLatestLedger, sorobanLedgerSource } from '@fair-fx/core/stellar';

// Asks live RPC nodes, so it needs the network: FAIRFX_SMOKE=1 pnpm --filter @fair-fx/core test smoke
const SMOKE = readEnv('FAIRFX_SMOKE') === '1';
const CONFIG_DIR = fileURLToPath(new URL('../../../../../config', import.meta.url));

// `config/networks.json` gets its testnet entry with the testnet deploy.
const TESTNET = { rpcUrl: 'https://soroban-testnet.stellar.org' };

describe.skipIf(!SMOKE)('the latest ledger of a live RPC node', () => {
  // Unix seconds, not milliseconds, and not a ledger from before this test was written: later than
  // 2026-11-18 and below 10^10, which is the year 2286.
  const liveLedger = {
    status: LedgerStatus.Ok,
    sequence: expect.toSatisfy((sequence: number) => Number.isSafeInteger(sequence) && sequence > 0),
    closeTime: expect.toSatisfy((closeTime: number) => closeTime > 1_795_000_000 && closeTime < 10_000_000_000),
  };

  it('has a sequence and a close time on mainnet, at the RPC URL in config/', async () => {
    const { endpoints } = await loadConfig(CONFIG_DIR, Network.Mainnet);

    const reading = await readLatestLedger(sorobanLedgerSource(endpoints));

    expect(reading).toEqual(liveLedger);
  });

  it('has a sequence and a close time on testnet', async () => {
    const source = sorobanLedgerSource(TESTNET);

    const reading = await readLatestLedger(source);

    expect(reading).toEqual(liveLedger);
  });
});
