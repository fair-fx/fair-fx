import type { JsonResponse } from './http.types.ts';
import { parseJsonOrNull } from './json.ts';

/** Reads the body of `response` as JSON, whatever the HTTP status. */
export async function toJsonResponse(response: Response): Promise<JsonResponse> {
  return { status: response.status, headers: response.headers, body: parseJsonOrNull(await response.text()) };
}
