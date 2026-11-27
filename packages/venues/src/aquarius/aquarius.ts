import { NoRouteCause, type Quote, QuoteErrorCause, QuoteStatus, type SwapAssets } from '@fair-fx/core';
import { z } from 'zod';
import { HTTP_OK, type JsonResponse } from '../http/index.ts';
import { errorQuote, httpErrorCause, noRouteQuote } from '../quote/index.ts';
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
 * Only a path that pays more than zero is an `ok` quote. No path is `no_route` as `no_path`, and that is
 * also how Aquarius answers an amount too small for its pools: its API says it finds a path only when
 * the path pays more than zero. A path that pays nothing would be `no_route` as `pays_nothing`, a
 * request Aquarius refused because it lists no such token is `no_route` as `unlisted_token`. Any other
 * HTTP error, or a body of another shape, is `error`.
 *
 * The ledger of an `ok` quote is `null`: Aquarius prices a path from the pool state it has indexed
 * and does not say at which ledger.
 */
export function toAquariusQuote(response: JsonResponse): Quote<AquariusRoute> {
  if (response.status !== HTTP_OK) {
    return refusedUnlistedToken(response)
      ? noRouteQuote(NoRouteCause.UnlistedToken)
      : errorQuote(httpErrorCause(response.status), findPathFailure(response));
  }

  const answer = findPathSchema.safeParse(response.body);
  if (!answer.success) {
    return errorQuote(QuoteErrorCause.BadAnswer, `aquarius response: ${z.prettifyError(answer.error)}`);
  }

  const path = answer.data;

  return path !== null && path.amountOut > 0n
    ? { status: QuoteStatus.Ok, amountOut: path.amountOut, route: path.route, ledger: null }
    : noRouteQuote(path === null ? NoRouteCause.NoPath : NoRouteCause.PaysNothing);
}
