import { vi } from 'vitest';
import type { Database, DatabaseSession } from '../database/index.ts';
import { LOCK_WAIT_CEILING_MS, LOCK_WAIT_INTERVAL_MS } from './testing.constants.ts';

/**
 * Inserts a run for `slot` in a transaction and leaves it open, as a run that is writing does. Resolves
 * to the session that holds it.
 */
export async function holdSlot(database: Database, slot: Date): Promise<DatabaseSession> {
  const session = await database.connect();
  await session.query('BEGIN');
  await session.query(
    "INSERT INTO run (slot, started_at, finished_at, reference_state) VALUES ($1, $1, $1, 'unknown')",
    [slot],
  );

  return session;
}

/** Commits the transaction `holdSlot` left open. */
export async function commitHeldSlot(session: DatabaseSession): Promise<void> {
  await session.query('COMMIT');
  session.release();
}

/** Resolves once a session of this database is waiting for a lock another session holds. */
export async function untilASessionWaits(database: Database): Promise<void> {
  await vi.waitFor(
    async () => {
      const waiting = await database.query(
        "SELECT 1 FROM pg_stat_activity WHERE datname = current_database() AND wait_event_type = 'Lock'",
      );
      if (waiting.rows.length === 0) {
        throw new Error('no session is waiting for a lock yet');
      }
    },
    { timeout: LOCK_WAIT_CEILING_MS, interval: LOCK_WAIT_INTERVAL_MS },
  );
}
