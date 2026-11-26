import { z } from 'zod';
import type { DirectAmounts, FailedRequest } from './soroswap.types.ts';

/** The value `router_get_amounts_out` returns for a path of two tokens: the amount in, then the amount out. */
export const directAmountsSchema: z.ZodType<DirectAmounts> = z
  .tuple([z.bigint(), z.bigint().min(0n)])
  .transform(([amountIn, amountOut]) => ({ amountIn, amountOut }));

/**
 * A request the SDK's HTTP client, axios, gave up on. It carries `response` when the node answered with
 * an HTTP error, and `code` for why no answer came.
 */
export const failedRequestSchema: z.ZodType<FailedRequest> = z.object({
  isAxiosError: z.literal(true),
  code: z.string().optional(),
  response: z.object({ status: z.number() }).optional(),
});

/** A JSON-RPC error object. The SDK throws it as it came, not as an `Error`. */
export const jsonRpcErrorSchema = z.object({ code: z.number(), message: z.string() });
