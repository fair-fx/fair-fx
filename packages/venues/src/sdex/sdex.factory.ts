import type { JsonResponse } from '../shared/index.ts';

/** One record of a strict-send answer, with only the fields the adapter reads: 91.8509809 EURC, traded directly. */
export function buildStrictSendRecord(overrides: object = {}): object {
  return { destination_amount: '91.8509809', path: [], ...overrides };
}

/** A 200 answer to a strict-send request listing `records`, from a Horizon at ledger 65680158. */
export function buildStrictSendResponse(
  records: readonly unknown[],
  overrides: Partial<JsonResponse> = {},
): JsonResponse {
  return {
    status: 200,
    headers: new Headers({ 'Latest-Ledger': '65680158' }),
    body: { _embedded: { records } },
    ...overrides,
  };
}
