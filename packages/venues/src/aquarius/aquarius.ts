import { QuoteStatus, type Quote, type SwapAssets } from '@fair-fx/core';
import { z } from 'zod';
import { errorQuote, HTTP_OK, type JsonResponse } from '../shared/index.ts';
import { findPathSchema } from './aquarius.schema.ts';
import type { AquariusRoute, FindPathRequest } from './aquarius.types.ts';
import { findPathFailure, refusedUnlistedToken } from './failure.ts';

/** The find-path request for "what would `amountIn` of `swap.input` pay in `swap.output`". */
export function findPathRequest(swap: SwapAssets, amountIn: bigint): FindPathRequest {
  return {
    token_in_address: swap.input.contract,
    token_out_address: swap.output.contract,
    amount: amountIn.toString(),
  };
}

/**
 * Turns Aquarius's answer to a find-path request into a quote. Never throws.
 *
 * Only a path that pays more than zero is an `ok` quote. No path, or one that pays nothing, is
 * `no_route`. So is a request Aquarius refused because it lists no such token. Any other HTTP error,
 * or a body of another shape, is `error`.
 *
 * The ledger of an `ok` quote is `null`: Aquarius prices a path from the pool state it has indexed
 * and does not say at which ledger.
 */
export function toAquariusQuote(response: JsonResponse): Quote<AquariusRoute> {
  if (response.status !== HTTP_OK) {
    return refusedUnlistedToken(response) ? { status: QuoteStatus.NoRoute } : errorQuote(findPathFailure(response));
  }

  const answer = findPathSchema.safeParse(response.body);
  if (!answer.success) {
    return errorQuote(`aquarius response: ${z.prettifyError(answer.error)}`);
  }

  const path = answer.data;

  return path !== null && path.amountOut > 0n
    ? { status: QuoteStatus.Ok, amountOut: path.amountOut, route: path.route, ledger: null }
    : { status: QuoteStatus.NoRoute };
}
