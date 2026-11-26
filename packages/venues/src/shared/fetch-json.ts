import type { Fetch, JsonResponse } from './http.types.ts';
import { toJsonResponse } from './json-response.ts';

/**
 * GETs `url` and reads the body as JSON, whatever the HTTP status. Rejects when the request fails
 * or takes longer than `timeoutMs`.
 */
export async function fetchJson(fetchFn: Fetch, url: URL, timeoutMs: number): Promise<JsonResponse> {
  const response = await fetchFn(url, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(timeoutMs),
  });

  return toJsonResponse(response);
}
