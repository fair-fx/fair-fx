import { readFile } from 'node:fs/promises';
import { ConfigError, errorMessage } from '../shared/index.ts';

/** Reads and parses the JSON file at `path`. Any failure becomes a ConfigError naming the file. */
export async function loadFile<T>(path: string, parse: (json: unknown) => T): Promise<T> {
  try {
    return parse(JSON.parse(await readFile(path, 'utf8')));
  } catch (error) {
    throw new ConfigError(`${path}: ${errorMessage(error)}`, { cause: error });
  }
}
