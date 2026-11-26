/** The router view that prices a swap along a path of token contracts. */
export const GET_AMOUNTS_OUT = 'router_get_amounts_out';

/** A router view with no arguments. Every Soroswap router answers it. */
export const GET_FACTORY = 'get_factory';

/**
 * What a simulation fails with when a call reaches a contract that is not deployed. The router derives a
 * pair's address from its two tokens, so a pair nobody created fails this way. So does a call to an
 * address that is not a router at all.
 */
export const MISSING_CONTRACT = 'Error(Storage, MissingValue)';

/** The router's `LibraryInsufficientLiquidity`: the pair exists and one of its reserves is empty. */
export const EMPTY_POOL = 'Error(Contract, #511)';
