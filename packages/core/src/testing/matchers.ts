import type { RateMathErrorCode } from '../rate/index.ts';

/** For `toThrow`: a RateMathError refused with `code`, whatever its message. */
export function rateMathError(code: RateMathErrorCode): unknown {
  return expect.objectContaining({ name: 'RateMathError', code });
}
