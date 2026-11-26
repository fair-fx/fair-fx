import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import { floorOut, RateMathErrorCode, refOut, shortfallBps, type RateLeg } from '@fair-fx/core';

const VECTORS_FILE = new URL('../../../../spec/vectors/rate-math.json', import.meta.url);
const USD_PRICE = 100_000_000_000_000n;

const integer = z
  .string()
  .regex(/^-?\d+$/)
  .transform((digits) => BigInt(digits));

const swapFields = {
  amount_in: integer,
  price_in: integer,
  decimals_in: z.int().nonnegative(),
  price_out: integer,
  decimals_out: z.int().nonnegative(),
};

/** The cases of one function: those that return `expected` and those refused with `error`. */
function casesWith<Inputs extends z.ZodRawShape>(inputs: Inputs) {
  const named = { name: z.string(), ...inputs };
  return z.strictObject({
    returns: z.array(z.strictObject({ ...named, expected: integer })),
    refuses: z.array(z.strictObject({ ...named, error: z.enum(RateMathErrorCode) })),
  });
}

const vectorsFile = z.strictObject({
  ref_out: casesWith(swapFields),
  shortfall_bps: casesWith({ ref_out: integer, actual_out: integer }),
  floor: casesWith({ ref_out: integer, max_shortfall_bps: integer }),
  snapshot_2026_11_09: z.array(
    z.strictObject({ name: z.string(), ...swapFields, actual_out: integer, ref_out: integer, shortfall_bps: integer }),
  ),
});

const vectors = vectorsFile.parse(JSON.parse(await readFile(VECTORS_FILE, 'utf8')));

interface LegFields {
  price_in: bigint;
  decimals_in: number;
  price_out: bigint;
  decimals_out: number;
}

function legsOf(fields: LegFields): [input: RateLeg, output: RateLeg] {
  return [
    { price: fields.price_in, decimals: fields.decimals_in },
    { price: fields.price_out, decimals: fields.decimals_out },
  ];
}

function rateMathError(code: RateMathErrorCode): unknown {
  return expect.objectContaining({ name: 'RateMathError', code });
}

describe('refOut', () => {
  it.each(vectors.ref_out.returns)('$name', (vector) => {
    const reference = refOut(vector.amount_in, ...legsOf(vector));

    expect(reference).toBe(vector.expected);
  });

  it.each(vectors.ref_out.refuses)('refuses: $name', (vector) => {
    const compute = (): bigint => refOut(vector.amount_in, ...legsOf(vector));

    expect(compute).toThrow(rateMathError(vector.error));
  });

  // Not in the shared file: the contract holds decimals in an unsigned integer.
  it.each([
    { what: 'negative', decimals: -1 },
    { what: 'fractional', decimals: 6.5 },
  ])('refuses $what token decimals', ({ decimals }) => {
    const usd: RateLeg = { price: USD_PRICE, decimals: 7 };

    const compute = (): bigint => refOut(1_000_000_000n, usd, { ...usd, decimals });

    expect(compute).toThrow(rateMathError(RateMathErrorCode.InvalidPolicy));
  });
});

describe('shortfallBps', () => {
  it.each(vectors.shortfall_bps.returns)('$name', (vector) => {
    const shortfall = shortfallBps(vector.ref_out, vector.actual_out);

    expect(shortfall).toBe(vector.expected);
  });

  it.each(vectors.shortfall_bps.refuses)('refuses: $name', (vector) => {
    const compute = (): bigint => shortfallBps(vector.ref_out, vector.actual_out);

    expect(compute).toThrow(rateMathError(vector.error));
  });
});

describe('floorOut', () => {
  it.each(vectors.floor.returns)('$name', (vector) => {
    const floor = floorOut(vector.ref_out, vector.max_shortfall_bps);

    expect(floor).toBe(vector.expected);
  });

  it.each(vectors.floor.refuses)('refuses: $name', (vector) => {
    const compute = (): bigint => floorOut(vector.ref_out, vector.max_shortfall_bps);

    expect(compute).toThrow(rateMathError(vector.error));
  });

  // Not in the shared file: the contract holds the limit in an unsigned integer.
  it('refuses a negative limit', () => {
    const compute = (): bigint => floorOut(1_000_000_000n, -1n);

    expect(compute).toThrow(rateMathError(RateMathErrorCode.InvalidPolicy));
  });
});

describe('mainnet snapshot of 2026-11-09', () => {
  it.each(vectors.snapshot_2026_11_09)('$name', (quote) => {
    const reference = refOut(quote.amount_in, ...legsOf(quote));
    const shortfall = shortfallBps(reference, quote.actual_out);

    expect(reference).toBe(quote.ref_out);
    expect(shortfall).toBe(quote.shortfall_bps);
  });
});
