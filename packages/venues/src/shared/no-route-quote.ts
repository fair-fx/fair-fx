import { QuoteStatus, type NoRouteCause, type QuoteNoRoute } from '@fair-fx/core';

/** A `no_route` quote. An adapter always says why, as far as its venue does. */
export function noRouteQuote(cause: NoRouteCause): QuoteNoRoute {
  return { status: QuoteStatus.NoRoute, cause };
}
