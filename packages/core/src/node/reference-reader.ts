import {
  baseReference,
  ReferenceStatus,
  toReferenceReading,
  type Fiat,
  type ReferenceFeed,
  type ReferenceReading,
} from '../index.ts';
import { REFERENCE_BASE } from '../reference/index.ts';
import { errorMessageWithCause } from '../shared/index.ts';

/**
 * Reads the reference price of `fiat` from `feed`. The feed's base currency is answered without a
 * call. A failed call is returned as `unavailable`, never thrown and never replaced by an earlier price.
 */
export async function readReference(feed: ReferenceFeed, fiat: Fiat): Promise<ReferenceReading> {
  if (fiat === REFERENCE_BASE) {
    return baseReference();
  }

  try {
    const [decimals, lastPrice] = await Promise.all([feed.decimals(), feed.lastPrice(fiat)]);

    return toReferenceReading(fiat, decimals, lastPrice);
  } catch (error) {
    return { status: ReferenceStatus.Unavailable, fiat, reason: errorMessageWithCause(error) };
  }
}
