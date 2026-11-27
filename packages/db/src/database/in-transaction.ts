import { SET_STATEMENT_TIMEOUT_SQL, STATEMENT_TIMEOUT_MS } from './database.constants.ts';
import type { Database, DatabaseSession } from './database.types.ts';

/**
 * Runs `work` in one transaction: committed when it resolves, rolled back when it rejects. The server
 * cancels a statement of `work` that takes longer than `statementTimeoutMs`, and `work` rejects.
 */
export async function inTransaction<Result>(
  database: Database,
  work: (session: DatabaseSession) => Promise<Result>,
  statementTimeoutMs = STATEMENT_TIMEOUT_MS,
): Promise<Result> {
  const session = await database.connect();
  try {
    await session.query('BEGIN');
    await session.query(SET_STATEMENT_TIMEOUT_SQL, [String(statementTimeoutMs)]);
    const result = await work(session);
    await session.query('COMMIT');

    return result;
  } catch (error) {
    await session.query('ROLLBACK');
    throw error;
  } finally {
    session.release();
  }
}
