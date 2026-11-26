import { Account, BASE_FEE, rpc, scValToNative, TransactionBuilder, type xdr } from '@stellar/stellar-sdk';
import type { NetworkConfig } from '../index.ts';
import { SimulationError } from './simulation.error.ts';

// A simulated transaction is never submitted, so its sequence number and time bound are placeholders.
const PLACEHOLDER_SEQUENCE = '0';
const PLACEHOLDER_TIME_BOUND_SECONDS = 30;

export type SimulationNetwork = Pick<NetworkConfig, 'passphrase' | 'simulationSource'>;

/** Simulates one contract call and returns its result as a native value. Nothing is signed or sent. */
export async function simulateRead(
  server: rpc.Server,
  network: SimulationNetwork,
  call: xdr.Operation,
): Promise<unknown> {
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

  return scValToNative(simulation.result.retval);
}
