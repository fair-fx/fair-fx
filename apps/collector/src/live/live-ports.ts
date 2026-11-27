import type { NetworkConfig } from '@fair-fx/core';
import { sorobanLedgerSource, sorobanReferenceFeed } from '@fair-fx/core/stellar';
import type { Database } from '@fair-fx/db';
import { writeRun } from '@fair-fx/db/writes';
import { aquariusAdapter, sdexAdapter, soroswapAdapter } from '@fair-fx/venues';
import type { CollectorPorts } from '../collect/index.ts';

/** The live network of `endpoints`, the machine's clock and `database`. Only reads the network. */
export function livePorts(endpoints: NetworkConfig, database: Database): CollectorPorts {
  return {
    venues: [sdexAdapter(endpoints), soroswapAdapter(endpoints), aquariusAdapter(endpoints)],
    feed: sorobanReferenceFeed(endpoints),
    ledger: sorobanLedgerSource(endpoints),
    now: () => new Date(),
    store: (run) => writeRun(database, run),
  };
}
