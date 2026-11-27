import { readFile } from 'node:fs/promises';
import type { Mock } from 'vitest';
import type { Fetch } from '../http/index.ts';

const FIXTURES = new URL('../../../../tests/fixtures/aquarius/', import.meta.url);

// Written out, not imported from the code under test: a wrong constant there must fail a test.
const RECORDED_STATUS = 200;

interface RecordedWith {
  readonly status?: number;
}

/** A `fetch` that answers with `tests/fixtures/aquarius/<name>.json`, a body the Aquarius API really sent. */
export async function aquariusAnswering(name: string, recordedWith: RecordedWith = {}): Promise<Mock<Fetch>> {
  const { status = RECORDED_STATUS } = recordedWith;
  const body = await readFile(new URL(`${name}.json`, FIXTURES), 'utf8');

  return vi.fn<Fetch>(() => Promise.resolve(new Response(body, { status })));
}
