import { z } from 'zod';
import { accountId, contractId } from '../shared/index.ts';
import { Fiat, type PinnedAsset } from './asset.types.ts';

// Soroban token amounts are i128, which has at most 38 full decimal digits.
const MAX_DECIMALS = 38;

export const pinnedAssetSchema: z.ZodType<PinnedAsset> = z.strictObject({
  contract: contractId,
  code: z.string().regex(/^[A-Za-z0-9]{1,12}$/, 'expected an asset code of 1 to 12 letters or digits'),
  issuer: accountId,
  fiat: z.enum(Fiat),
  decimals: z.int().min(0).max(MAX_DECIMALS),
});
