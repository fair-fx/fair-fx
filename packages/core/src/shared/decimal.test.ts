import { formatDecimalAmount, parseDecimalAmount } from '@fair-fx/core';

describe('parseDecimalAmount', () => {
  it.each([
    { what: 'a Horizon amount', text: '91.8214628', decimals: 7, amount: 918_214_628n },
    { what: 'a whole number', text: '100', decimals: 7, amount: 1_000_000_000n },
    { what: 'fewer digits than decimals', text: '0.5', decimals: 7, amount: 5_000_000n },
    { what: 'zero', text: '0.0000000', decimals: 7, amount: 0n },
    { what: 'a long empty fraction', text: '904170985.000000000000000000', decimals: 0, amount: 904_170_985n },
  ])('reads $what', ({ text, decimals, amount }) => {
    const parsed = parseDecimalAmount(text, decimals);

    expect(parsed).toBe(amount);
  });

  it('cuts off digits past the decimals without rounding', () => {
    const parsed = parseDecimalAmount('1.99999999', 7);

    expect(parsed).toBe(19_999_999n);
  });

  it.each(['', 'abc', '-1', '1e5', '1.', '.5', '1,5', ' 1'])('returns null for %j', (text) => {
    const parsed = parseDecimalAmount(text, 7);

    expect(parsed).toBeNull();
  });
});

describe('formatDecimalAmount', () => {
  it.each([
    { amount: 1_000_000_000n, decimals: 7, text: '100.0000000' },
    { amount: 1n, decimals: 7, text: '0.0000001' },
    { amount: 0n, decimals: 7, text: '0.0000000' },
    { amount: 100n, decimals: 0, text: '100' },
  ])('writes $amount with $decimals decimals as $text', ({ amount, decimals, text }) => {
    const formatted = formatDecimalAmount(amount, decimals);

    expect(formatted).toBe(text);
  });

  it('refuses a negative amount', () => {
    const format = (): string => formatDecimalAmount(-1n, 7);

    expect(format).toThrow(new RangeError('expected an amount of zero or more, got -1'));
  });
});
