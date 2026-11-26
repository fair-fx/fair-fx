import type { Fetch, JsonResponse } from './http.types.ts';
import { parseJsonOrNull } from './json.ts';

export const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * GETs `url` and reads the body as JSON, whatever the HTTP status. Rejects when the request fails
 * or takes longer than `timeoutMs`.
 */
export async function fetchJson(fetchFn: Fetch, url: URL, timeoutMs: number): Promise<JsonResponse> {
  const response = await fetchFn(url, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(timeoutMs),
  });

  return { status: response.status, headers: response.headers, body: parseJsonOrNull(await response.text()) };
}
