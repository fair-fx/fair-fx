/** A raw `simulateTransaction` answer for a call the host or the contract refused with `error`, at ledger 65681036. */
export function buildFailedSimulation(error: string): object {
  return { jsonrpc: '2.0', id: 1, result: { error, events: [], latestLedger: 65_681_036 } };
}
