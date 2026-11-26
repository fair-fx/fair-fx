import { errorMessageWithCause, type QuoteError, QuoteErrorCause } from '@fair-fx/core';
import { SimulationError } from '@fair-fx/core/node';
import { errorQuote, httpErrorCause } from '../shared/index.ts';
import { MissingRouterError } from './missing-router.error.ts';
import { REQUEST_TIMED_OUT } from './soroswap.constants.ts';
import { failedRequestSchema, jsonRpcErrorSchema } from './soroswap.schema.ts';
import type { FailedRequest } from './soroswap.types.ts';

/** Which kind of failure a request the SDK's HTTP client gave up on was. */
export function failedRequestCause(request: FailedRequest): QuoteErrorCause {
  if (request.response !== undefined) {
    return httpErrorCause(request.response.status);
  }

  return request.code === REQUEST_TIMED_OUT ? QuoteErrorCause.Timeout : QuoteErrorCause.Network;
}

/**
 * Which kind of failure a rejected read of the router was. A simulation the node ran and that failed, a
 * JSON-RPC error and a missing router are all the venue refusing the request.
 */
export function rpcErrorCause(failure: unknown): QuoteErrorCause {
  if (failure instanceof SimulationError || failure instanceof MissingRouterError) {
    return QuoteErrorCause.Rejected;
  }

  const request = failedRequestSchema.safeParse(failure);
  if (request.success) {
    return failedRequestCause(request.data);
  }

  return jsonRpcErrorSchema.safeParse(failure).success ? QuoteErrorCause.Rejected : QuoteErrorCause.Unknown;
}

/** The `error` quote for a read of the router that rejected. */
export function rpcFailure(failure: unknown): QuoteError {
  return errorQuote(rpcErrorCause(failure), errorMessageWithCause(failure));
}
