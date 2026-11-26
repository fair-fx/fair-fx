import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Writes `networks` and `pairs` as `networks.json` and `pairs.json` in a new temporary folder and
 * returns its path. The folder is removed when the test that asked for it finishes.
 */
export async function writeConfigDir(networks: unknown, pairs: unknown): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'fairfx-config-'));
  onTestFinished(() => rm(dir, { recursive: true }));

  await Promise.all([
    writeFile(join(dir, 'networks.json'), JSON.stringify(networks)),
    writeFile(join(dir, 'pairs.json'), JSON.stringify(pairs)),
  ]);

  return dir;
}
