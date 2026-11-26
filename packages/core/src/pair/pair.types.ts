import type { PinnedAsset } from '../asset/index.ts';
import type { Network } from '../network/index.ts';

/** Swap direction of a pair, named as the API names it. */
export enum Direction {
  BaseToQuote = 'base_to_quote',
  QuoteToBase = 'quote_to_base',
}

/** Two pinned assets quoted against each other. */
export interface Pair {
  /** `BASE/QUOTE`, for example `USDC/EURC`. */
  readonly id: string;
  readonly base: PinnedAsset;
  readonly quote: PinnedAsset;
}

/** The token a swap spends and the token it receives. */
export interface SwapAssets {
  readonly input: PinnedAsset;
  readonly output: PinnedAsset;
}

/** The pairs of one network and the shared ladder, from `config/pairs.json`. */
export interface PairsConfig {
  readonly network: Network;
  /** Input sizes in whole units of the input token, 10 rungs, strictly increasing. */
  readonly ladder: readonly bigint[];
  readonly pairs: readonly Pair[];
}
