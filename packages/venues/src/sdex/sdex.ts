import { formatDecimalAmount, QuoteStatus, type Quote, type SwapAssets } from '@fair-fx/core';
import { z } from 'zod';
import { errorQuote, HTTP_OK, urlUnder, type JsonResponse } from '../shared/index.ts';
import { bestPath, horizonAssetType, horizonFailure, latestLedger } from './horizon.ts';
import { CLASSIC_DECIMALS, STRICT_SEND_PATH } from './sdex.constants.ts';
import { strictSendPathsSchema } from './sdex.schema.ts';
import type { SdexRoute } from './sdex.types.ts';

/** The Horizon request for "what would `amountIn` of `swap.input` pay in `swap.output`". */
export function strictSendUrl(horizonUrl: string, swap: SwapAssets, amountIn: bigint): URL {
  const url = urlUnder(horizonUrl, STRICT_SEND_PATH);
  url.search = new URLSearchParams({
    source_asset_type: horizonAssetType(swap.input.code),
    source_asset_code: swap.input.code,
    source_asset_issuer: swap.input.issuer,
    source_amount: formatDecimalAmount(amountIn, CLASSIC_DECIMALS),
    destination_assets: `${swap.output.code}:${swap.output.issuer}`,
  }).toString();

  return url;
}

/**
 * Turns Horizon's answer to a strict-send request into a quote. Never throws.
 *
 * An empty list of paths is `no_route`. Several paths give the one that pays the most. An HTTP error
 * or a body of another shape is `error`.
 */
export function toSdexQuote(response: JsonResponse): Quote<SdexRoute> {
  if (response.status !== HTTP_OK) {
    return errorQuote(horizonFailure(response));
  }

  const paths = strictSendPathsSchema.safeParse(response.body);
  if (!paths.success) {
    return errorQuote(`horizon response: ${z.prettifyError(paths.error)}`);
  }

  const best = bestPath(paths.data);
  if (best === undefined) {
    return { status: QuoteStatus.NoRoute };
  }

  return {
    status: QuoteStatus.Ok,
    amountOut: best.amountOut,
    route: best.route,
    ledger: latestLedger(response.headers),
  };
}
