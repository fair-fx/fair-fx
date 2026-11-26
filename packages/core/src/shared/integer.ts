// Soroban token amounts and the contract's arithmetic are i128.
const I128_MAX = 2n ** 127n - 1n;
const I128_MIN = -(2n ** 127n);

/** `10^38` fits in i128 and `10^39` does not, so an i128 holds at most 38 full decimal digits. */
export const LARGEST_EXPONENT_OF_TEN_IN_I128 = 38;

export function fitsI128(value: bigint): boolean {
  return value >= I128_MIN && value <= I128_MAX;
}

/** `/` truncates toward zero, which is already the ceiling of a negative quotient. */
export function divideRoundingUp(dividend: bigint, positiveDivisor: bigint): bigint {
  const quotient = dividend / positiveDivisor;

  return dividend % positiveDivisor > 0n ? quotient + 1n : quotient;
}
