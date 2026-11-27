/** How long a new connection may take, the TLS and login exchange included. */
export const CONNECT_TIMEOUT_MS = 10_000;

/**
 * How long the server may spend on one statement of a transaction, the wait for a lock included. A run
 * is written in 3 statements and a commit, so a write that meets every limit, the connect included,
 * still ends in 70 seconds.
 */
export const STATEMENT_TIMEOUT_MS = 15_000;

/**
 * Sets the statement limit `$1` (milliseconds, as text) for the transaction it runs in. A setting of the
 * transaction, not of the session, so it holds behind a pooler that hands the session to someone else.
 */
export const SET_STATEMENT_TIMEOUT_SQL = "SELECT set_config('statement_timeout', $1, true)";
