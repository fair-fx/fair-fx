import { describe, expect, it } from 'vitest';
import { isDirection } from './index.js';

describe('isDirection', () => {
  it('accepts the two API directions and rejects anything else', () => {
    expect(isDirection('base_to_quote')).toBe(true);
    expect(isDirection('quote_to_base')).toBe(true);
    expect(isDirection('usd_to_eur')).toBe(false);
  });
});
