import process, { stderr, stdout } from 'node:process';
import { loadConfig } from '@fair-fx/core/node';
import { openDatabase } from '@fair-fx/db';
import { runOnce } from './collect/index.ts';
import { parseCollectorEnv } from './env/index.ts';
import { collectorPlan, livePorts } from './live/index.ts';
import { failureLogLine, LogEvent, runLogLine, writeLogLine } from './log/index.ts';

// One run, then exit. What starts it every 5 minutes is not part of the collector.
try {
  const env = parseCollectorEnv(process.env);
  const config = await loadConfig(env.configDir, env.network);
  const database = openDatabase(env.databaseUrl);
  const logDatabaseError = (error: unknown) => writeLogLine(stderr, failureLogLine(LogEvent.DatabaseError, error));
  database.on('error', logDatabaseError);
  try {
    const report = await runOnce(livePorts(config.endpoints, database), collectorPlan(config));
    writeLogLine(stdout, runLogLine(report));
  } finally {
    // A pool that will not close does not fail a run that is stored, nor hide why a run failed.
    await database.end().catch(logDatabaseError);
  }
} catch (error) {
  writeLogLine(stderr, failureLogLine(LogEvent.RunFailed, error));
  process.exitCode = 1;
}
