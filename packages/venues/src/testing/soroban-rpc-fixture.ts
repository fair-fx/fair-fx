import { readFile } from 'node:fs/promises';
import { TransactionBuilder } from '@stellar/stellar-sdk';
import type { Mock } from 'vitest';
import { z } from 'zod';
import type { Fetch } from '../http/index.ts';

const FIXTURES = new URL('../../../../tests/fixtures/soroban-rpc/', import.meta.url);

const simulateRequestSchema = z.object({ params: z.object({ transaction: z.string() }) });
const hostFunctionSchema = z.object({ invoke_contract: z.unknown() });

/**
 * A `fetch` that answers one request after another with `tests/fixtures/soroban-rpc/<name>.json`,
 * bodies a Soroban RPC node really sent. A request past the last name is refused.
 */
export async function sorobanRpcAnswering(...names: readonly string[]): Promise<Mock<Fetch>> {
  const bodies = await Promise.all(names.map((name) => readFile(new URL(`${name}.json`, FIXTURES), 'utf8')));
  const fetch = vi.fn<Fetch>(() => Promise.reject(new Error('no recorded answer is left for this request')));
  for (const body of bodies) {
    fetch.mockResolvedValueOnce(new Response(body));
  }

  return fetch;
}

/** A `fetch` that answers every request with `body` as JSON, for an answer that could not be recorded. */
export function sorobanRpcSaying(body: unknown): Mock<Fetch> {
  return vi.fn<Fetch>(() => Promise.resolve(Response.json(body)));
}

/**
 * The contract call inside each `simulateTransaction` request `fetch` received, in the SDK's JSON form:
 * `{ contract_address, function_name, args }`.
 */
export function simulatedCalls(fetch: Mock<Fetch>, passphrase: string): unknown[] {
  return fetch.mock.calls.map(([, init]) => {
    const request = simulateRequestSchema.parse(JSON.parse(String(init?.body)));
    const [call] = TransactionBuilder.fromXDR(request.params.transaction, passphrase).operations;
    assert(call?.type === 'invokeHostFunction', 'expected the request to simulate one contract call');

    return hostFunctionSchema.parse(JSON.parse(JSON.stringify(call.func))).invoke_contract;
  });
}
