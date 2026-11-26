export const HTTP_OK = 200;

/** How long one request to a venue may take, unless the caller says otherwise. */
export const DEFAULT_TIMEOUT_MS = 10_000;

/** The name of the error `AbortSignal.timeout` aborts a request with. */
export const TIMEOUT_ERROR_NAME = 'TimeoutError';
