import { GuardMode, VenueId } from '@fair-fx/core';

/** Soroban venues can be wrapped by the guard contract. SDEX cannot: a contract cannot call it. */
export const GUARD_MODE: Readonly<Record<VenueId, GuardMode>> = {
  [VenueId.Sdex]: GuardMode.B,
  [VenueId.Soroswap]: GuardMode.A,
  [VenueId.Aquarius]: GuardMode.A,
  [VenueId.Curve]: GuardMode.A,
};
