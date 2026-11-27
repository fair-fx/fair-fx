import { LedgerStatus } from '@fair-fx/core';
import { readLatestLedger } from '@fair-fx/core/stellar';
import { buildLedgerSource } from '@fair-fx/core/testing';

describe('readLatestLedger', () => {
  it('returns the sequence and the close time of the ledger the node answers', async () => {
    const source = buildLedgerSource();

    const reading = await readLatestLedger(source);

    expect(reading).toEqual({
      status: LedgerStatus.Ok,
      sequence: 65_693_709,
      closeTime: 1_795_754_616, // Unix seconds: 2026-11-27 04:43:36 UTC
    });
  });

  it.each([
    {
      what: 'the node cannot be reached',
      thrown: new Error('fetch failed', { cause: new Error('getaddrinfo ENOTFOUND rpc.invalid') }),
      reason: 'fetch failed: getaddrinfo ENOTFOUND rpc.invalid',
    },
    {
      what: 'the node answers a JSON-RPC error',
      thrown: { code: -32_601, message: 'method not found' },
      reason: 'method not found',
    },
  ])('returns unavailable with the reason when $what', async ({ thrown, reason }) => {
    const source = buildLedgerSource({ latestLedger: () => Promise.reject(thrown) });

    const reading = await readLatestLedger(source);

    expect(reading).toEqual({ status: LedgerStatus.Unavailable, reason });
  });
});
