/** The contract at the configured router address does not answer as a Soroswap router. */
export class MissingRouterError extends Error {
  override readonly name = 'MissingRouterError';
}
