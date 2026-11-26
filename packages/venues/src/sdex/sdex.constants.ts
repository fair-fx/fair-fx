/** Horizon's path finding endpoint for "send exactly this much", relative to the Horizon URL. */
export const STRICT_SEND_PATH = 'paths/strict-send';

/** Horizon writes every classic amount as a decimal string with 7 decimals. */
export const CLASSIC_DECIMALS = 7;

/** A classic asset code of up to 4 characters is `credit_alphanum4`, a longer one `credit_alphanum12`. */
export const LONGEST_ALPHANUM4_CODE = 4;

/** Response header holding the latest ledger Horizon had ingested when it answered. */
export const LATEST_LEDGER_HEADER = 'latest-ledger';
