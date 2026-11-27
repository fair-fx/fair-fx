import type { LedgerSource } from './ledger.types.ts';

/**
 * A `getLatestLedger` answer for mainnet ledger 65,693,709, closed at 2026-11-27 04:43:36 UTC, in
 * the shape a node sends it. The header and meta XDR of a real answer are left out: a reading does
 * not use them.
 */
export const LATEST_LEDGER_ANSWER = {
  id: 'eef527f1344546559410d7be0f4e8f418518949d4c4878d8fc70cef09e9d0c54',
  protocolVersion: 30,
  sequence: 65_693_709,
  closeTime: '1795754616',
};

/** A node that answers `LATEST_LEDGER_ANSWER`, with `overrides` replacing the call. */
export function buildLedgerSource(overrides: Partial<LedgerSource> = {}): LedgerSource {
  return {
    latestLedger: () => Promise.resolve(LATEST_LEDGER_ANSWER),
    ...overrides,
  };
}
