import type { Fetch } from '../http/index.ts';

/** A `fetch` that never answers. Like the real one, it rejects with the signal's reason once the signal aborts. */
export const fetchThatNeverAnswers: Fetch = (_url, init) =>
  new Promise((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => {
      reject(init.signal?.reason);
    });
  });
