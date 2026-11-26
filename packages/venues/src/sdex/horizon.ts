import type { JsonResponse } from '../shared/index.ts';
import { horizonProblemSchema } from './sdex.schema.ts';
import type { SdexPath } from './sdex.types.ts';

const LONGEST_ALPHANUM4_CODE = 4;
const LATEST_LEDGER_HEADER = 'latest-ledger';

/** Horizon names a classic asset by the length of its code. */
export function horizonAssetType(code: string): 'credit_alphanum4' | 'credit_alphanum12' {
  return code.length <= LONGEST_ALPHANUM4_CODE ? 'credit_alphanum4' : 'credit_alphanum12';
}

/** The path that pays the most, or `undefined` when there is none. Horizon may list several. */
export function bestPath(paths: readonly SdexPath[]): SdexPath | undefined {
  return paths.reduce<SdexPath | undefined>(
    (best, path) => (best === undefined || path.amountOut > best.amountOut ? path : best),
    undefined,
  );
}

/** The latest ledger Horizon had ingested when it answered, or `null` when the header is absent. */
export function latestLedger(headers: Headers): number | null {
  const ledger = Number(headers.get(LATEST_LEDGER_HEADER));

  return Number.isSafeInteger(ledger) && ledger > 0 ? ledger : null;
}

/** Describes an HTTP error from Horizon: the status, plus the title and reason when Horizon gives them. */
export function horizonFailure(response: JsonResponse): string {
  const problem = horizonProblemSchema.safeParse(response.body);
  if (!problem.success) {
    return `horizon answered ${response.status}`;
  }

  const { title, extras } = problem.data;

  return extras === undefined
    ? `horizon answered ${response.status}: ${title}`
    : `horizon answered ${response.status}: ${title} (${extras.reason})`;
}
