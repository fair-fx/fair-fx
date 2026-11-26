import type { JsonResponse } from '../shared/index.ts';
import { findPathProblemSchema } from './aquarius.schema.ts';

/** Describes an HTTP error from Aquarius: the status, plus what it said about each field when it says so. */
export function findPathFailure(response: JsonResponse): string {
  const problem = findPathProblemSchema.safeParse(response.body);
  const said = problem.success ? Object.entries(problem.data) : [];
  if (said.length === 0) {
    return `aquarius answered ${response.status}`;
  }

  const reasons = said.map(([field, fieldReasons]) => `${field}: ${fieldReasons.join(' ')}`);

  return `aquarius answered ${response.status}: ${reasons.join(', ')}`;
}
