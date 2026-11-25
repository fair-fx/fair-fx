import { Direction } from './direction.js';
import { isEnumValue, parseEnumValue } from './enum.js';

describe('isEnumValue', () => {
  it('accepts enum values and rejects enum keys', () => {
    expect(isEnumValue(Direction, 'base_to_quote')).toBe(true);
    expect(isEnumValue(Direction, 'BaseToQuote')).toBe(false);
  });
});

describe('parseEnumValue', () => {
  it('returns the typed value', () => {
    expect(parseEnumValue(Direction, 'quote_to_base', 'direction')).toBe(Direction.QuoteToBase);
  });

  it('names the field and the allowed values when it rejects', () => {
    expect(() => parseEnumValue(Direction, 'sideways', 'direction')).toThrow(
      'direction: expected one of base_to_quote, quote_to_base, got sideways',
    );
  });
});
