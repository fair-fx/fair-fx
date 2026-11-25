/** Fiat currency of a pinned asset, as the reference feed names it. */
export enum Fiat {
  Usd = 'USD',
  Eur = 'EUR',
}

/** A token FairFX quotes, pinned by contract ID and by code plus issuer. */
export interface PinnedAsset {
  /** Contract ID of the asset's SAC. */
  readonly contract: string;
  /** Classic asset code, 1 to 12 letters or digits. */
  readonly code: string;
  /** Account ID of the issuer, confirmed from the issuer's own publication. */
  readonly issuer: string;
  readonly fiat: Fiat;
  readonly decimals: number;
}

/** How a caller names an asset. A code alone is not one: anyone can issue an asset with any code. */
export type AssetRef = { readonly contract: string } | { readonly code: string; readonly issuer: string };
