import { QuoteStatus, swapAssets, VenueId, type VenueAdapter } from '@fair-fx/core';
import { GUARD_MODE } from '../guard-mode.ts';
import { DEFAULT_TIMEOUT_MS, failureReason, fetchJson, type HttpOptions } from '../shared/index.ts';
import { strictSendUrl, toSdexQuote } from './sdex.ts';
import type { SdexNetwork, SdexRoute } from './sdex.types.ts';

/** Quotes SDEX and the Classic AMM together, through Horizon path finding. */
export function sdexAdapter(network: SdexNetwork, options: HttpOptions = {}): VenueAdapter<SdexRoute> {
  const { fetch: fetchFn = fetch, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  return {
    id: VenueId.Sdex,
    mode: GUARD_MODE[VenueId.Sdex],

    async quote(pair, direction, amountIn) {
      if (amountIn <= 0n) {
        return { status: QuoteStatus.Error, reason: `expected an amount in above zero, got ${amountIn}` };
      }

      try {
        const url = strictSendUrl(network.horizonUrl, swapAssets(pair, direction), amountIn);

        return toSdexQuote(await fetchJson(fetchFn, url, timeoutMs));
      } catch (error) {
        return { status: QuoteStatus.Error, reason: failureReason(error, timeoutMs) };
      }
    },
  };
}
