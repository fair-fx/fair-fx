/** The message of a thrown value, whatever was thrown. */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * `errorMessage`, followed by the message of the error's cause when it has one. Node's fetch throws
 * "fetch failed" and keeps the reason (DNS, refused connection, timeout) in the cause.
 */
export function errorMessageWithCause(error: unknown): string {
  const message = errorMessage(error);
  if (error instanceof Error && error.cause !== undefined) {
    return `${message}: ${errorMessage(error.cause)}`;
  }

  return message;
}
