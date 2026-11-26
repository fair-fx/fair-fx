import { divideRoundingUp } from '../shared/index.ts';
import { isTokenDecimals, powerOfTen, withinI128 } from './rate.checks.ts';
import { BPS } from './rate.constants.ts';
import { RateMathError } from './rate.error.ts';
import { RateMathErrorCode, type RateLeg } from './rate.types.ts';

/**
 * What `amountIn` is worth in the output token at the reference prices, rounded down.
 *
 * An amount too small to price gives 0. Refusing it is the caller's decision, not this function's.
 */
export function refOut(amountIn: bigint, input: RateLeg, output: RateLeg): bigint {
  if (input.price <= 0n || output.price <= 0n) {
    throw new RateMathError(RateMathErrorCode.OracleInvalid, 'a reference price is zero or negative');
  }

  if (!isTokenDecimals(input.decimals) || !isTokenDecimals(output.decimals)) {
    throw new RateMathError(RateMathErrorCode.InvalidPolicy, 'token decimals must be a whole number, 0 or more');
  }

  const value = withinI128(amountIn * input.price);
  const scale = powerOfTen(Math.abs(output.decimals - input.decimals));
  if (output.decimals >= input.decimals) {
    return withinI128(value * scale) / output.price;
  }

  return value / withinI128(output.price * scale);
}

/**
 * How far `actualOut` falls short of `reference`, in basis points. Positive means the user received
 * less than the reference, negative means more.
 *
 * Rounded up, so that `shortfallBps(reference, actualOut) <= limit` holds exactly when
 * `actualOut >= floorOut(reference, limit)`.
 */
export function shortfallBps(reference: bigint, actualOut: bigint): bigint {
  if (reference <= 0n) {
    throw new RateMathError(RateMathErrorCode.AmountOutOfRange, 'the reference output is zero or negative');
  }

  const missing = withinI128(reference - actualOut);
  const missingBps = withinI128(missing * BPS);

  return divideRoundingUp(missingBps, reference);
}

/**
 * The least output that keeps a swap within `maxShortfallBps` of `reference`, rounded up.
 *
 * A reference of 0 gives a floor of 0, which protects nothing. Check the reference before using
 * the result as a minimum.
 */
export function floorOut(reference: bigint, maxShortfallBps: bigint): bigint {
  if (maxShortfallBps < 0n || maxShortfallBps > BPS) {
    throw new RateMathError(RateMathErrorCode.InvalidPolicy, `the limit must be 0 to ${BPS} bps`);
  }

  const kept = withinI128(reference * (BPS - maxShortfallBps));

  return divideRoundingUp(kept, BPS);
}
