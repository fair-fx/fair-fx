import { z } from 'zod';

/** A thrown value that is not an `Error` and still carries a message, such as a JSON-RPC error object. */
export const thrownWithMessageSchema = z.object({ message: z.string() });
