import { NoRouteCause, QuoteErrorCause, QuoteStatus, VenueId } from '@fair-fx/core';
import type { Database } from '@fair-fx/db';
import { writeRun } from '@fair-fx/db/writes';
import { buildCollectorPorts, buildVenueAdapter } from '../collect/collect.factory.ts';
import type { CollectorPorts } from '../collect/index.ts';

/**
 * Ports with one venue of each outcome, that write every run to `database`: SDEX pays, Soroswap times
 * out on every quote and Aquarius has no route.
 */
export function portsWritingTo(database: Database): CollectorPorts {
  return buildCollectorPorts({
    venues: [
      buildVenueAdapter(),
      buildVenueAdapter({
        id: VenueId.Soroswap,
        quote: () =>
          Promise.resolve({ status: QuoteStatus.Error, cause: QuoteErrorCause.Timeout, reason: 'no answer' }),
      }),
      buildVenueAdapter({
        id: VenueId.Aquarius,
        quote: () => Promise.resolve({ status: QuoteStatus.NoRoute, cause: NoRouteCause.NoPath }),
      }),
    ],
    store: (run) => writeRun(database, run),
  });
}
