import { readFile } from 'node:fs/promises';
import type { Mock } from 'vitest';
import type { Fetch } from '../http/index.ts';

const FIXTURES = new URL('../../../../tests/fixtures/horizon/', import.meta.url);

// Written out, not imported from the code under test: a wrong constant there must fail a test.
const RECORDED_STATUS = 200;

interface RecordedWith {
  readonly status?: number;
  /** Sent back as the `Latest-Ledger` header. Left out when not given. */
  readonly latestLedger?: number;
}

/** A `fetch` that answers with `tests/fixtures/horizon/<name>.json`, a body Horizon really sent. */
export async function horizonAnswering(name: string, recordedWith: RecordedWith = {}): Promise<Mock<Fetch>> {
  const { status = RECORDED_STATUS, latestLedger } = recordedWith;
  const headers = latestLedger === undefined ? {} : { 'Latest-Ledger': String(latestLedger) };
  const body = await readFile(new URL(`${name}.json`, FIXTURES), 'utf8');

  return vi.fn<Fetch>(() => Promise.resolve(new Response(body, { status, headers })));
}
