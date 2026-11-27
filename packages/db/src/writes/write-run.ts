import { inTransaction, type Database, type DatabaseSession } from '../database/index.ts';
import { storableJson } from './storable.ts';
import { toQuoteRow } from './quote-row.ts';
import { toReferenceRow } from './reference-row.ts';
import { WriteRunOutcome, type FinishedRun } from './run.types.ts';
import {
  INSERT_QUOTE_SAMPLES_SQL,
  INSERT_REFERENCE_SAMPLES_SQL,
  INSERT_RUN_SQL,
} from './write-run.constants.ts';

/**
 * Stores `run` with all its samples in one transaction, so a slot is stored whole or not at all.
 *
 * When another run already wrote the slot, nothing is stored and the outcome says so. When two runs
 * write one slot at the same time, the first to commit wins and the other waits, then sees it taken.
 * Rejects when the database refuses a row or a statement takes longer than `statementTimeoutMs`, the
 * wait for the other run included, and then nothing of the run is stored.
 */
export function writeRun(
  database: Database,
  run: FinishedRun,
  statementTimeoutMs?: number,
): Promise<WriteRunOutcome> {
  const store = async (session: DatabaseSession): Promise<WriteRunOutcome> => {
    const inserted = await session.query<{ id: string }>(INSERT_RUN_SQL, [
      run.slot,
      run.startedAt,
      run.finishedAt,
      run.ledger,
      run.referenceState,
    ]);
    const runId = inserted.rows[0]?.id;
    if (runId === undefined) {
      return WriteRunOutcome.SlotTaken;
    }

    await session.query(INSERT_REFERENCE_SAMPLES_SQL, [runId, storableJson(run.references.map(toReferenceRow))]);
    await session.query(INSERT_QUOTE_SAMPLES_SQL, [runId, storableJson(run.quotes.map(toQuoteRow))]);

    return WriteRunOutcome.Written;
  };

  return inTransaction(database, store, statementTimeoutMs);
}
