import type { VenueAdapter, VenueId } from '@fair-fx/core';
import { buildVenueAdapter } from '../collect/collect.factory.ts';

/** The most quote requests that were open at the same moment: in one ladder, and in all of them. */
export interface OpenRequestPeaks {
  readonly mostOpenInALadder: number;
  readonly openAtOnce: number;
}

/** Venues that count their open quote requests per ladder, a ladder being one venue and one direction. */
export interface OpenRequestCounter {
  /** A venue that answers as `buildVenueAdapter` does, one turn of the event loop after it is asked. */
  venue(id: VenueId): VenueAdapter;
  peaks(): OpenRequestPeaks;
}

export function openRequestCounter(): OpenRequestCounter {
  const open = new Map<string, number>();
  let mostOpenInALadder = 0;
  let openAtOnce = 0;

  return {
    venue: (id) => {
      const venue = buildVenueAdapter({ id });

      return {
        ...venue,
        quote: async (pair, direction, amountIn) => {
          const ladder = `${id} ${direction}`;
          open.set(ladder, (open.get(ladder) ?? 0) + 1);
          mostOpenInALadder = Math.max(mostOpenInALadder, ...open.values());
          openAtOnce = Math.max(openAtOnce, [...open.values()].reduce((sum, count) => sum + count, 0));
          await new Promise((resolve) => setImmediate(resolve));
          open.set(ladder, (open.get(ladder) ?? 0) - 1);

          return venue.quote(pair, direction, amountIn);
        },
      };
    },
    peaks: () => ({ mostOpenInALadder, openAtOnce }),
  };
}
