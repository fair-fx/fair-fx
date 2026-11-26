/** Why the rate math refused an input, named as the `fx_guard` contract names its errors. */
export enum RateMathErrorCode {
  AmountOutOfRange = 'AmountOutOfRange',
  OracleInvalid = 'OracleInvalid',
  MathOverflow = 'MathOverflow',
  InvalidPolicy = 'InvalidPolicy',
}

/** One side of a swap: the reference price of its currency and the decimals of its token. */
export interface RateLeg {
  /** USD price of the currency with 14 decimals. USD itself is 10^14. */
  readonly price: bigint;
  readonly decimals: number;
}
