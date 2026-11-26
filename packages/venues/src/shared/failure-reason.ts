import { errorMessageWithCause } from '@fair-fx/core';

// The name of the error `AbortSignal.timeout` aborts a request with.
const TIMEOUT_ERROR = 'TimeoutError';

/** Why a request to a venue failed, for the `reason` of an `error` quote. */
export function failureReason(error: unknown, timeoutMs: number): string {
  if (error instanceof Error && error.name === TIMEOUT_ERROR) {
    return `timed out after ${timeoutMs} ms`;
  }

  return errorMessageWithCause(error);
}
