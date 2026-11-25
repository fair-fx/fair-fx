import { z } from 'zod';

// Shape only. The StrKey checksum needs the Stellar SDK, so the test of the real config files checks it.
export const accountId = z.string().regex(/^G[A-Z2-7]{55}$/, 'expected an account ID (G...)');
export const contractId = z.string().regex(/^C[A-Z2-7]{55}$/, 'expected a contract ID (C...)');

export const httpsUrl = z.url({ protocol: /^https$/, error: 'expected an https URL' });
