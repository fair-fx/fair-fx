import type { Fetch, JsonResponse } from './http.types.ts';
import { toJsonResponse } from './json-response.ts';

/**
 * POSTs `body` as JSON to `url` and reads the answer as JSON, whatever the HTTP status. Rejects when
 * the request fails or takes longer than `timeoutMs`.
 */
export async function postJson(fetchFn: Fetch, url: URL, body: unknown, timeoutMs: number): Promise<JsonResponse> {
  const response = await fetchFn(url, {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });

  return toJsonResponse(response);
}
