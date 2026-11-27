import type { LogLine } from './log.types.ts';

/** Where a log line goes: standard output or standard error. */
export interface LogStream {
  write(chunk: string): unknown;
}

/** Writes `line` to `stream` as one line of JSON. */
export function writeLogLine(stream: LogStream, line: LogLine): void {
  stream.write(`${JSON.stringify(line)}\n`);
}
