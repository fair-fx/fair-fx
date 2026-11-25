import { GuardMode, VenueId } from '@fairfx/core';
import { describe, expect, it } from 'vitest';
import { GUARD_MODE } from './index.js';

describe('GUARD_MODE', () => {
  it('has a mode for every venue', () => {
    expect(Object.keys(GUARD_MODE).sort()).toEqual(Object.values(VenueId).sort());
  });

  it('never claims the contract can wrap SDEX', () => {
    expect(GUARD_MODE[VenueId.Sdex]).toBe(GuardMode.B);
  });
});
