export const CORE_ENTRY = 'browser-safe' as const;

export type Direction = 'base_to_quote' | 'quote_to_base';

export function isDirection(value: string): value is Direction {
  return value === 'base_to_quote' || value === 'quote_to_base';
}
