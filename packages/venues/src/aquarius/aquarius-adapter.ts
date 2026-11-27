import { DEFAULT_TIMEOUT_MS, swapAssets, VenueId, type QuoteError, type VenueAdapter } from '@fair-fx/core';
import { GUARD_MODE } from '../guard-mode/index.ts';
import { type HttpOptions, postJson } from '../http/index.ts';
import { fetchFailure, quoteOrError } from '../quote/index.ts';
import { findPathRequest, toAquariusQuote } from './aquarius.ts';
import type { AquariusNetwork, AquariusRoute } from './aquarius.types.ts';

/** Quotes the best path through the Aquarius pools, as its find-path API finds it. */
export function aquariusAdapter(network: AquariusNetwork, options: HttpOptions = {}): VenueAdapter<AquariusRoute> {
  const { fetch: fetchFn = fetch, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const toError = (failure: unknown): QuoteError => fetchFailure(failure, timeoutMs);

  return {
    id: VenueId.Aquarius,
    mode: GUARD_MODE[VenueId.Aquarius],

    quote(pair, direction, amountIn) {
      return quoteOrError(amountIn, toError, async () => {
        const url = new URL(network.aquariusFindPathUrl);
        const request = findPathRequest(swapAssets(pair, direction), amountIn);

        return toAquariusQuote(await postJson(fetchFn, url, request, timeoutMs));
      });
    },
  };
}
