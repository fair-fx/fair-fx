import { swapAssets, type Direction, type Pair } from '@fair-fx/core';

/**
 * The amounts to quote for `pair` in `direction`: every rung of `ladder`, which is in whole units, in
 * the smallest unit of the input token.
 */
export function ladderAmounts(ladder: readonly bigint[], pair: Pair, direction: Direction): bigint[] {
  const { input } = swapAssets(pair, direction);
  const unit = 10n ** BigInt(input.decimals);

  return ladder.map((rung) => rung * unit);
}
