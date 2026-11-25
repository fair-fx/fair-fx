import { describe, expect, it } from 'vitest';
import { parseDirection } from './index.js';

describe('parseDirection', () => {
  it('passes a known direction through core', () => {
    expect(parseDirection('quote_to_base')).toBe('quote_to_base');
  });

  it('rejects an unknown direction', () => {
    expect(() => parseDirection('sideways')).toThrow(RangeError);
  });
});
