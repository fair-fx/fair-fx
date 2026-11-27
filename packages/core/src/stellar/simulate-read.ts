import { Account, BASE_FEE, rpc, scValToNative, TransactionBuilder, type xdr } from '@stellar/stellar-sdk';
import type { NetworkConfig } from '../index.ts';
import { SimulationError } from './simulation.error.ts';
import { PLACEHOLDER_SEQUENCE, PLACEHOLDER_TIME_BOUND_SECONDS } from './soroban.constants.ts';

export type SimulationNetwork = Pick<NetworkConfig, 'passphrase' | 'simulationSource'>;

/** What one simulated contract call returned. */
export interface SimulatedRead {
  /** The contract's return value as a native value, unchecked. */
  readonly value: unknown;
  /** The latest ledger the RPC node knew when it ran the simulation. */
  readonly ledger: number;
}

/** Simulates one contract call. Nothing is signed or sent. Throws a `SimulationError` when the call fails. */
export async function simulateRead(
  server: rpc.Server,
  network: SimulationNetwork,
  call: xdr.Operation,
): Promise<SimulatedRead> {
  const source = new Account(network.simulationSource, PLACEHOLDER_SEQUENCE);
  const transaction = new TransactionBuilder(source, { fee: BASE_FEE, networkPassphrase: network.passphrase })
    .addOperation(call)
    .setTimeout(PLACEHOLDER_TIME_BOUND_SECONDS)
    .build();

  const simulation = await server.simulateTransaction(transaction);
  if (rpc.Api.isSimulationError(simulation)) {
    throw new SimulationError(simulation.error);
  }

  if (simulation.result === undefined) {
    throw new SimulationError('the simulation returned no value');
  }

  return { value: scValToNative(simulation.result.retval), ledger: simulation.latestLedger };
}
