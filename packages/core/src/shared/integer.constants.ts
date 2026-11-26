// Soroban token amounts and the contract's arithmetic are i128.
export const I128_MAX = 2n ** 127n - 1n;
export const I128_MIN = -(2n ** 127n);

/** `10^38` fits in i128 and `10^39` does not, so an i128 holds at most 38 full decimal digits. */
export const LARGEST_EXPONENT_OF_TEN_IN_I128 = 38;
