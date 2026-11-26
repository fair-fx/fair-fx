import { DEFAULT_TIMEOUT_MS, swapAssets, VenueId, type VenueAdapter } from '@fair-fx/core';
import { GUARD_MODE } from '../guard-mode.constants.ts';
import { fetchJson, quoteOrError, type HttpOptions } from '../shared/index.ts';
import { strictSendUrl, toSdexQuote } from './sdex.ts';
import type { SdexNetwork, SdexRoute } from './sdex.types.ts';

/** Quotes SDEX and the Classic AMM together, through Horizon path finding. */
export function sdexAdapter(network: SdexNetwork, options: HttpOptions = {}): VenueAdapter<SdexRoute> {
  const { fetch: fetchFn = fetch, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  return {
    id: VenueId.Sdex,
    mode: GUARD_MODE[VenueId.Sdex],

    quote(pair, direction, amountIn) {
      return quoteOrError(amountIn, timeoutMs, async () => {
        const url = strictSendUrl(network.horizonUrl, swapAssets(pair, direction), amountIn);

        return toSdexQuote(await fetchJson(fetchFn, url, timeoutMs));
      });
    },
  };
}
