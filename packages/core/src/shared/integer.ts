import { I128_MAX, I128_MIN } from './integer.constants.ts';

export function fitsI128(value: bigint): boolean {
  return value >= I128_MIN && value <= I128_MAX;
}

/** `/` truncates toward zero, which is already the ceiling of a negative quotient. */
export function divideRoundingUp(dividend: bigint, positiveDivisor: bigint): bigint {
  const quotient = dividend / positiveDivisor;

  return dividend % positiveDivisor > 0n ? quotient + 1n : quotient;
}
