import { RateMathErrorCode, type RateLeg } from './rate.types.ts';

const BPS = 10_000n;

// The contract computes in i128. Every step here is held to the same range, so an amount the
// contract refuses with MathOverflow is refused here too.
const I128_MAX = 2n ** 127n - 1n;
const I128_MIN = -(2n ** 127n);
const LARGEST_EXPONENT_OF_TEN_IN_I128 = 38;

/** The rate math refused an input. `code` says why. */
export class RateMathError extends Error {
  override readonly name = 'RateMathError';

  constructor(
    readonly code: RateMathErrorCode,
    detail: string,
  ) {
    super(`${code}: ${detail}`);
  }
}

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
  const value = multiply(amountIn, input.price);
  const scale = powerOfTen(Math.abs(output.decimals - input.decimals));
  if (output.decimals >= input.decimals) {
    return multiply(value, scale) / output.price;
  }
  return value / multiply(output.price, scale);
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
  const missing = subtract(reference, actualOut);
  return divideRoundingUp(multiply(missing, BPS), reference);
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
  return divideRoundingUp(multiply(reference, BPS - maxShortfallBps), BPS);
}

function isTokenDecimals(decimals: number): boolean {
  return Number.isInteger(decimals) && decimals >= 0;
}

function multiply(a: bigint, b: bigint): bigint {
  return withinI128(a * b);
}

function subtract(a: bigint, b: bigint): bigint {
  return withinI128(a - b);
}

function powerOfTen(exponent: number): bigint {
  if (exponent > LARGEST_EXPONENT_OF_TEN_IN_I128) {
    throw overflow();
  }
  return 10n ** BigInt(exponent);
}

function withinI128(value: bigint): bigint {
  if (value < I128_MIN || value > I128_MAX) {
    throw overflow();
  }
  return value;
}

function overflow(): RateMathError {
  return new RateMathError(RateMathErrorCode.MathOverflow, 'a step of the calculation does not fit in i128');
}

/** `/` truncates toward zero, which is already the ceiling of a negative quotient. */
function divideRoundingUp(dividend: bigint, positiveDivisor: bigint): bigint {
  const quotient = dividend / positiveDivisor;
  return dividend % positiveDivisor > 0n ? quotient + 1n : quotient;
}
