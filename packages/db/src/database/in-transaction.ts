import type { Database, DatabaseSession } from './database.types.ts';

/** Runs `work` in one transaction: committed when it resolves, rolled back when it rejects. */
export async function inTransaction<Result>(
  database: Database,
  work: (session: DatabaseSession) => Promise<Result>,
): Promise<Result> {
  const session = await database.connect();
  try {
    await session.query('BEGIN');
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
