import { fitsI128, LARGEST_EXPONENT_OF_TEN_IN_I128 } from '../shared/index.ts';
import { RateMathError } from './rate.error.ts';
import { RateMathErrorCode } from './rate.types.ts';

export function isTokenDecimals(decimals: number): boolean {
  return Number.isInteger(decimals) && decimals >= 0;
}

export function powerOfTen(exponent: number): bigint {
  if (exponent > LARGEST_EXPONENT_OF_TEN_IN_I128) {
    throw overflowError();
  }

  return 10n ** BigInt(exponent);
}

// The contract computes in i128. Every step here is held to the same range, so an amount the
// contract refuses with MathOverflow is refused here too.
export function withinI128(value: bigint): bigint {
  if (!fitsI128(value)) {
    throw overflowError();
  }

  return value;
}

export function overflowError(): RateMathError {
  return new RateMathError(RateMathErrorCode.MathOverflow, 'a step of the calculation does not fit in i128');
}
