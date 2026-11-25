import { z } from 'zod';
import { accountId, contractId, httpsUrl } from '../shared/index.ts';
import { Network, type NetworkConfig } from './network.types.ts';

const networkSchema: z.ZodType<NetworkConfig> = z.strictObject({
  passphrase: z.string().min(1),
  horizonUrl: httpsUrl,
  rpcUrl: httpsUrl,
  aquariusFindPathUrl: httpsUrl,
  soroswapRouter: contractId,
  reflectorFiatFeed: contractId,
  simulationSource: accountId,
});

export const networksFileSchema = z.partialRecord(z.enum(Network), networkSchema);
