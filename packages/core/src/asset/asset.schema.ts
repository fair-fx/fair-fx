import { z } from 'zod';
import { accountId, contractId, LARGEST_EXPONENT_OF_TEN_IN_I128 } from '../shared/index.ts';
import { Fiat, type PinnedAsset } from './asset.types.ts';

export const pinnedAssetSchema: z.ZodType<PinnedAsset> = z.strictObject({
  contract: contractId,
  code: z.string().regex(/^[A-Za-z0-9]{1,12}$/, 'expected an asset code of 1 to 12 letters or digits'),
  issuer: accountId,
  fiat: z.enum(Fiat),
  decimals: z.int().min(0).max(LARGEST_EXPONENT_OF_TEN_IN_I128),
});
