import { thrownWithMessageSchema } from './error.schema.ts';

/**
 * The message of a thrown value, whatever was thrown. An `AggregateError` with no message of its own
 * gives the messages of its errors: Node rejects a connect to a name with several addresses that way.
 */
export function errorMessage(error: unknown): string {
  if (error instanceof AggregateError && error.message === '') {
    return error.errors.map(errorMessage).join('; ');
  }

  if (error instanceof Error) {
    return error.message;
  }

  const thrown = thrownWithMessageSchema.safeParse(error);

  return thrown.success ? thrown.data.message : String(error);
}

/**
 * `errorMessage`, followed by the message of the error's cause when it has one and the message does
 * not hold it already. Node's fetch throws "fetch failed" and keeps the reason (DNS, refused
 * connection, timeout) in the cause.
 */
export function errorMessageWithCause(error: unknown): string {
  const message = errorMessage(error);
  if (!(error instanceof Error) || error.cause === undefined) {
    return message;
  }

  const cause = errorMessage(error.cause);

  return message.includes(cause) ? message : `${message}: ${cause}`;
}
