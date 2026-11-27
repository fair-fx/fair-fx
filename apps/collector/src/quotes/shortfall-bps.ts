import { RateMathError, refOut, shortfallBps, type RateLeg } from '@fair-fx/core';

/**
 * How far `amountOut` falls short of what `amountIn` is worth at the reference prices, in basis
 * points. `null` when the rate math refuses the inputs, which includes an amount in worth less than
 * one smallest unit of the output token: its reference output is 0.
 */
export function measuredShortfallBps(
  amountIn: bigint,
  amountOut: bigint,
  input: RateLeg,
  output: RateLeg,
): bigint | null {
  try {
    return shortfallBps(refOut(amountIn, input, output), amountOut);
  } catch (error) {
    if (error instanceof RateMathError) {
      return null;
    }

    throw error;
  }
}
