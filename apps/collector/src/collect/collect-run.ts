import type { RunReadings } from '../run/index.ts';
import type { CollectorPlan, CollectorPorts } from './collect.types.ts';
import { readReferences } from './read-references.ts';
import { readRunClock } from './read-run-clock.ts';
import { takeQuotes } from './take-quotes.ts';

/**
 * Reads everything one run stores. The quotes are taken while the reference prices are read. The
 * latest ledger is read after the prices, so the ledger that dates them is at least as recent as
 * they are.
 */
export async function collectRun(ports: CollectorPorts, plan: CollectorPlan): Promise<RunReadings> {
  const { feed, ledger, now, venues } = ports;
  const startedAt = now();
  const readPricesThenClock = async (): Promise<Pick<RunReadings, 'references' | 'clock'>> => {
    const references = await readReferences(feed, plan.referenceSource, plan.pairs);

    return { references, clock: await readRunClock(ledger, now) };
  };

  const [quotes, { references, clock }] = await Promise.all([
    takeQuotes(venues, plan.pairs, plan.ladder, now),
    readPricesThenClock(),
  ]);

  return { startedAt, finishedAt: now(), clock, references, quotes };
}
