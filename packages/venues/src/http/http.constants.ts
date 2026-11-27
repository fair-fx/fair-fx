export const HTTP_OK = 200;

export const HTTP_TOO_MANY_REQUESTS = 429;

/** The first of the 5xx statuses, the ones a server answers with when the failure is its own. */
export const HTTP_SERVER_ERROR = 500;

/** The name of the error `AbortSignal.timeout` aborts a request with. */
export const TIMEOUT_ERROR_NAME = 'TimeoutError';
