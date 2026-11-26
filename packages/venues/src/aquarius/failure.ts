import type { JsonResponse } from '../shared/index.ts';
import { UNLISTED_TOKEN } from './aquarius.constants.ts';
import { findPathProblemSchema } from './aquarius.schema.ts';

/** What Aquarius said about each field of the request it refused. Empty when the body does not say. */
export function findPathProblem(response: JsonResponse): Readonly<Record<string, readonly string[]>> {
  const problem = findPathProblemSchema.safeParse(response.body);

  return problem.success ? problem.data : {};
}

/** Whether Aquarius refused the request for one reason only: it lists no token at an address. */
export function refusedUnlistedToken(response: JsonResponse): boolean {
  const reasons = Object.values(findPathProblem(response)).flat();

  return reasons.length > 0 && reasons.every((reason) => UNLISTED_TOKEN.test(reason));
}

/** Describes an HTTP error from Aquarius: the status, plus what it said about each field when it says so. */
export function findPathFailure(response: JsonResponse): string {
  const said = Object.entries(findPathProblem(response));
  if (said.length === 0) {
    return `aquarius answered ${response.status}`;
  }

  const reasons = said.map(([field, fieldReasons]) => `${field}: ${fieldReasons.join(' ')}`);

  return `aquarius answered ${response.status}: ${reasons.join(', ')}`;
}
