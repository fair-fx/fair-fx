import { GuardMode, VenueId } from '@fair-fx/core';
import { buildNetworkConfig } from '@fair-fx/core/testing';
import { aquariusAdapter, sdexAdapter, soroswapAdapter } from '@fair-fx/venues';

const NETWORK = buildNetworkConfig();

describe('every venue adapter', () => {
  it.each([
    { adapter: sdexAdapter(NETWORK), id: VenueId.Sdex, mode: GuardMode.B },
    { adapter: soroswapAdapter(NETWORK), id: VenueId.Soroswap, mode: GuardMode.A },
    { adapter: aquariusAdapter(NETWORK), id: VenueId.Aquarius, mode: GuardMode.A },
  ])('names itself $id and is guarded in mode $mode', ({ adapter, id, mode }) => {
    expect({ id: adapter.id, mode: adapter.mode }).toEqual({ id, mode });
  });
});
