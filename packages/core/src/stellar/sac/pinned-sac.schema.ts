import { Asset, StrKey } from '@stellar/stellar-sdk';
import { z } from 'zod';
import type { PinnedAsset } from '../../index.ts';

/**
 * An asset pinned to the SAC of its code and issuer on the network of `passphrase`. The issuer's
 * checksum is checked first: a SAC cannot be derived from an account ID that is not one.
 */
export function sacPinnedAssetSchema(passphrase: string): z.ZodType<PinnedAsset> {
  return z.custom<PinnedAsset>().superRefine((asset, context) => {
    if (!StrKey.isValidEd25519PublicKey(asset.issuer)) {
      context.addIssue({ code: 'custom', path: ['issuer'], message: 'expected an account ID with a valid checksum' });

      return;
    }

    const sac = new Asset(asset.code, asset.issuer).contractId(passphrase);
    if (sac !== asset.contract) {
      context.addIssue({
        code: 'custom',
        path: ['contract'],
        message: `expected ${sac}, the SAC of ${asset.code}:${asset.issuer} on "${passphrase}"`,
      });
    }
  });
}

/** The pairs of `pairs.json`, laid out as in the file so a problem is reported at its path there. */
export function sacPinnedPairsSchema(passphrase: string): z.ZodType<unknown> {
  const asset = sacPinnedAssetSchema(passphrase);

  return z.object({ pairs: z.record(z.string(), z.array(z.object({ base: asset, quote: asset }))) });
}
