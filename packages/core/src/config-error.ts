/** A config file has the wrong shape or a value out of range. The message starts with the field path. */
export class ConfigError extends Error {
  override readonly name = 'ConfigError';
}
