import type { RateMathErrorCode } from './rate.types.ts';

/** The rate math refused an input. `code` says why. */
export class RateMathError extends Error {
  override readonly name = 'RateMathError';

  constructor(
    readonly code: RateMathErrorCode,
    detail: string,
  ) {
    super(`${code}: ${detail}`);
  }
}
