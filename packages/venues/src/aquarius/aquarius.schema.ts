import { parseDecimalAmount } from '@fair-fx/core';
import { z } from 'zod';
import { AMOUNT_DECIMALS } from './aquarius.constants.ts';
import type { AquariusPath } from './aquarius.types.ts';

/**
 * An amount as Aquarius sends it, in the smallest unit of its token. The endpoint in `config/` sends
 * a decimal string (`"918572852.000000000000000000"`), read with its fraction cut off and not
 * rounded. The documented endpoints send a JSON integer. A JSON number too large to be exact is
 * refused: `z.int()` takes safe integers only.
 */
const amountSchema: z.ZodType<bigint> = z.union(
  [
    z
      .string()
      .transform((text) => parseDecimalAmount(text, AMOUNT_DECIMALS))
      .pipe(z.bigint()),
    z.int().nonnegative().transform(BigInt),
  ],
  'expected an amount that is not negative, as a decimal string or an integer',
);

/**
 * The body of a find-path answer, read as the path it found, or `null` when it found none. `success`
 * picks the reading, so a found path with a wrong field is reported with the name of that field.
 * Aquarius still sends every field when it finds no path, empty or zero. None of them is read.
 */
export const findPathSchema: z.ZodType<AquariusPath | null> = z
  .discriminatedUnion('success', [
    z.object({
      success: z.literal(true),
      amount: amountSchema,
      swap_chain_xdr: z.string().min(1, 'expected a swap chain'),
      pools: z.array(z.string()),
      tokens_addresses: z.array(z.string()),
    }),
    z.object({ success: z.literal(false) }),
  ])
  .transform((body) =>
    body.success
      ? {
          amountOut: body.amount,
          route: { swapChainXdr: body.swap_chain_xdr, pools: body.pools, tokens: body.tokens_addresses },
        }
      : null,
  );

const reasonsSchema: z.ZodType<readonly string[]> = z.union([
  z.array(z.string()),
  z.string().transform((reason) => [reason]),
]);

/**
 * The body Aquarius sends with an HTTP error: for each field of the request it refused, the reasons.
 * A reason about the request as a whole comes as text, not as a list (`detail`), and is read the same way.
 */
export const findPathProblemSchema: z.ZodType<Readonly<Record<string, readonly string[]>>> = z.record(
  z.string(),
  reasonsSchema,
);
