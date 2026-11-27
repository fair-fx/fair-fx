/** How a read of the latest ledger ended. */
export enum LedgerStatus {
  Ok = 'ok',
  /** The node answered with something that is not a ledger. */
  Invalid = 'invalid',
  /** The node could not be reached, or the call failed. */
  Unavailable = 'unavailable',
}

/** The latest ledger an RPC node knows: the clock of the chain as that node sees it. */
export interface LatestLedger {
  readonly status: LedgerStatus.Ok;
  readonly sequence: number;
  /**
   * When the ledger closed, in Unix seconds. It is the time on chain, not the time of the read: a
   * node that lags answers with an old ledger, and judging that is the caller's decision.
   */
  readonly closeTime: number;
}

export interface LedgerFailure {
  readonly status: LedgerStatus.Invalid | LedgerStatus.Unavailable;
  readonly reason: string;
}

/** A ledger read never falls back to an earlier ledger or to the local clock: it is one of these, each time. */
export type LedgerReading = LatestLedger | LedgerFailure;

/** The call a ledger read makes. It resolves to what the node returned, unchecked. */
export interface LedgerSource {
  latestLedger(): Promise<unknown>;
}
