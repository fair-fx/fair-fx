import { z } from 'zod';
import { accountId, contractId } from '../shared/index.ts';

// Soroban token amounts are i128, which has at most 38 full decimal digits.
const MAX_DECIMALS = 38;

/** Fiat currency of a pinned asset, as the reference feed names it. */
export enum Fiat {
  Usd = 'USD',
  Eur = 'EUR',
}

export const pinnedAssetSchema = z.strictObject({
  contract: contractId,
  code: z.string().regex(/^[A-Za-z0-9]{1,12}$/, 'expected an asset code of 1 to 12 letters or digits'),
  issuer: accountId,
  fiat: z.enum(Fiat),
  decimals: z.int().min(0).max(MAX_DECIMALS),
});

/** A token FairFX quotes, pinned by contract ID and by code plus issuer. */
export type PinnedAsset = Readonly<z.infer<typeof pinnedAssetSchema>>;

/** How a caller names an asset. A code alone is not one: anyone can issue an asset with any code. */
export type AssetRef = { readonly contract: string } | { readonly code: string; readonly issuer: string };
