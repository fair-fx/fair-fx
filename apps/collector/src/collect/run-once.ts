import { finishRun } from '../run/index.ts';
import type { CollectorPlan, CollectorPorts, RunReport } from './collect.types.ts';
import { collectRun } from './collect-run.ts';

/**
 * One collector run: reads, judges and stores it. A venue, the feed or the ledger failing does not
 * reject: the failure is stored as part of the run. Rejects when the store does, and then the run is
 * not stored.
 */
export async function runOnce(ports: CollectorPorts, plan: CollectorPlan): Promise<RunReport> {
  const readings = await collectRun(ports, plan);
  const run = finishRun(readings, plan.closedWindow);
  const outcome = await ports.store(run);

  return { readings, run, outcome };
}
