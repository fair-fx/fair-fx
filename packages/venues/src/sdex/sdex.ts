import { formatDecimalAmount, QuoteStatus, type Quote, type SwapAssets } from '@fair-fx/core';
import { z } from 'zod';
import type { JsonResponse } from '../shared/index.ts';
import { bestPath, horizonAssetType, horizonFailure, latestLedger } from './horizon.ts';
import { CLASSIC_DECIMALS, strictSendPathsSchema } from './sdex.schema.ts';
import type { SdexRoute } from './sdex.types.ts';

const STRICT_SEND = 'paths/strict-send';
const HTTP_OK = 200;

/** The Horizon request for "what would `amountIn` of `swap.input` pay in `swap.output`". */
export function strictSendUrl(horizonUrl: string, swap: SwapAssets, amountIn: bigint): URL {
  const url = new URL(STRICT_SEND, horizonUrl.endsWith('/') ? horizonUrl : `${horizonUrl}/`);
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
    return { status: QuoteStatus.Error, reason: horizonFailure(response) };
  }

  const paths = strictSendPathsSchema.safeParse(response.body);
  if (!paths.success) {
    return { status: QuoteStatus.Error, reason: `horizon response: ${z.prettifyError(paths.error)}` };
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
