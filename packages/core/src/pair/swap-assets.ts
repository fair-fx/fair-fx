import { Direction, type Pair, type SwapAssets } from './pair.types.ts';

/** Which token of the pair a swap in `direction` spends, and which it receives. */
export function swapAssets(pair: Pair, direction: Direction): SwapAssets {
  return direction === Direction.BaseToQuote
    ? { input: pair.base, output: pair.quote }
    : { input: pair.quote, output: pair.base };
}
