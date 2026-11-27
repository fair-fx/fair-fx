import { Fiat } from '../asset/index.ts';

/** Decimals of every price of the Reflector fiat feed. The contract refuses a feed with any other. */
export const REFERENCE_PRICE_DECIMALS = 14;

/** The feed prices every currency in USD, so it has no entry for USD itself. */
export const REFERENCE_BASE = Fiat.Usd;

/** A price older than this is not one to compare a quote against: 15 minutes. */
export const MAX_REFERENCE_AGE_SECONDS = 900;
