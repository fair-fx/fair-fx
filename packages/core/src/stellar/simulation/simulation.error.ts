/** A read-only contract call could not be simulated, or returned no value. */
export class SimulationError extends Error {
  override readonly name = 'SimulationError';
}
