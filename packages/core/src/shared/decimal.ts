import { DECIMAL_NUMBER } from './decimal.constants.ts';

/**
 * Reads a decimal string such as `"91.8214628"` as an integer with `decimals` decimal places.
 * Digits past `decimals` are cut off, never rounded. Returns `null` when the text is not a plain
 * non-negative decimal number.
 */
export function parseDecimalAmount(text: string, decimals: number): bigint | null {
  const match = DECIMAL_NUMBER.exec(text);
  if (match === null) {
    return null;
  }

  const [, whole = '', fraction = ''] = match;

  return BigInt(whole + fraction.slice(0, decimals).padEnd(decimals, '0'));
}

/**
 * Writes an integer with `decimals` decimal places as a decimal string: `1n` with 7 decimals is
 * `"0.0000001"`. Throws a RangeError for a negative amount.
 */
export function formatDecimalAmount(amount: bigint, decimals: number): string {
  if (amount < 0n) {
    throw new RangeError(`expected an amount of zero or more, got ${amount}`);
  }

  const digits = amount.toString().padStart(decimals + 1, '0');
  const whole = digits.slice(0, digits.length - decimals);
  const fraction = digits.slice(digits.length - decimals);

  return decimals === 0 ? whole : `${whole}.${fraction}`;
}
