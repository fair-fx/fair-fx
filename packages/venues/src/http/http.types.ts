/** The `fetch` an adapter calls. A test passes one that answers with a recorded response. */
export type Fetch = typeof fetch;

export interface HttpOptions {
  /** Defaults to the global `fetch`. */
  readonly fetch?: Fetch;
  /** How long one request may take. Defaults to `DEFAULT_TIMEOUT_MS`. */
  readonly timeoutMs?: number;
}

export interface JsonResponse {
  readonly status: number;
  readonly headers: Headers;
  /** The parsed body, or `null` when the body is not JSON. */
  readonly body: unknown;
}
