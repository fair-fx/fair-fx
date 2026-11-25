import { Fiat, type PinnedAsset } from './asset.types.ts';

export const USDC: PinnedAsset = {
  contract: 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75',
  code: 'USDC',
  issuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
  fiat: Fiat.Usd,
  decimals: 7,
};

export const EURC: PinnedAsset = {
  contract: 'CDTKPWPLOURQA2SGTKTUQOWRCBZEORB4BWBOMJ3D3ZTQQSGE5F6JBQLV',
  code: 'EURC',
  issuer: 'GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2',
  fiat: Fiat.Eur,
  decimals: 7,
};

/** An EURCV issuer its company has not confirmed, and the SAC of EURCV from it. Never pinned. */
export const EURCV_IMPERSONATOR = {
  issuer: 'GCEYGIVOLAVBF2TG2RUSGTUJCIN75KEX3NGLMY4VPL4GFE5L355AXW3G',
  contract: 'CANKBYNNAYKEZXLB655F2UPNTAZFK5HILZUXL7ZTFR3NF6LKDSVY7KFH',
} as const;
