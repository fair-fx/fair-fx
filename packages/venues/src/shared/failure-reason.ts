import { errorMessageWithCause } from '@fair-fx/core';
import { TIMEOUT_ERROR_NAME } from './http.constants.ts';

/** Why a request to a venue failed, for the `reason` of an `error` quote. */
export function failureReason(error: unknown, timeoutMs: number): string {
  if (error instanceof Error && error.name === TIMEOUT_ERROR_NAME) {
    return `timed out after ${timeoutMs} ms`;
  }

  return errorMessageWithCause(error);
}
