import { type Direction, isDirection } from '@fairfx/core';

export type VenueId = 'horizon' | 'soroswap' | 'aquarius';

export function parseDirection(value: string): Direction {
  if (!isDirection(value)) {
    throw new RangeError(`unknown direction: ${value}`);
  }
  return value;
}
