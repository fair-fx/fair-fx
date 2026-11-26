import { QuoteStatus, type Quote } from '@fair-fx/core';
import type { SimulatedRead } from '@fair-fx/core/node';
import { Address, Contract, nativeToScVal, xdr } from '@stellar/stellar-sdk';
import { z } from 'zod';
import { errorQuote } from '../shared/index.ts';
import { GET_AMOUNTS_OUT } from './soroswap.constants.ts';
import { directAmountsSchema } from './soroswap.schema.ts';
import type { SoroswapRoute } from './soroswap.types.ts';

/** The router call for "what would `amountIn` of the first token of `path` pay in the last one". */
export function getAmountsOutCall(router: string, amountIn: bigint, path: readonly string[]): xdr.Operation {
  return new Contract(router).call(
    GET_AMOUNTS_OUT,
    nativeToScVal(amountIn, { type: 'i128' }),
    xdr.ScVal.scvVec(path.map((token) => new Address(token).toScVal())),
  );
}

/**
 * Turns the router's answer for a direct pair into a quote. Never throws.
 *
 * An amount out of zero is `no_route`: the pool pays nothing for an amount this small. An answer that
 * is not two amounts is `error`.
 */
export function toSoroswapQuote(read: SimulatedRead, path: readonly string[]): Quote<SoroswapRoute> {
  const amounts = directAmountsSchema.safeParse(read.value);
  if (!amounts.success) {
    return errorQuote(`soroswap answer: ${z.prettifyError(amounts.error)}`);
  }

  const [, amountOut] = amounts.data;
  if (amountOut === 0n) {
    return { status: QuoteStatus.NoRoute };
  }

  return { status: QuoteStatus.Ok, amountOut, route: { path }, ledger: read.ledger };
}
