import type { LedgerSource } from '@fair-fx/core';

/**
 * A node that gives `answers` in turn, one per call, and pushes `answer` to `events` as each one
 * settles. Throws when asked more often than there are answers.
 */
export function ledgerSourceAnswering(
  events: string[],
  ...answers: ReadonlyArray<() => Promise<unknown>>
): LedgerSource {
  let call = 0;

  return {
    latestLedger: async () => {
      const answer = answers[call++];
      if (answer === undefined) {
        throw new Error('asked more often than the test expects');
      }

      try {
        return await answer();
      } finally {
        events.push('answer');
      }
    },
  };
}
