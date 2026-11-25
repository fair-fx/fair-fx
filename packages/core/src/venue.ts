/** Venues FairFX quotes. SDEX includes the Classic AMM, Horizon returns them as one path. */
export enum VenueId {
  Sdex = 'sdex',
  Soroswap = 'soroswap',
  Aquarius = 'aquarius',
  Curve = 'curve',
}

/** How the floor is enforced: A, the guard contract wraps the swap; B, the app sets destMin. */
export enum GuardMode {
  A = 'A',
  B = 'B',
}
