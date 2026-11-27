import { errorMessageWithCause } from '@fair-fx/core';
import type { FailureLogLine, LogEvent } from './log.types.ts';

/** The line logged for `error`, with its message and the messages of its causes. */
export function failureLogLine(
  event: LogEvent.RunFailed | LogEvent.DatabaseError,
  error: unknown,
): FailureLogLine {
  return { event, reason: errorMessageWithCause(error) };
}
