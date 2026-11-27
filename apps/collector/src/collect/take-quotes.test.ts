import { takeQuotes } from '@fair-fx/collector';
import { buildVenueAdapter, tickingClock } from '@fair-fx/collector/testing';
import { Direction, QuoteErrorCause, QuoteStatus, VenueId, type VenueAdapter } from '@fair-fx/core';
import { buildPair, EURC, USDC } from '@fair-fx/core/testing';

const pair = buildPair({ base: { ...USDC, decimals: 7 }, quote: { ...EURC, decimals: 2 } });

describe('takeQuotes', () => {
  it('takes every rung of the ladder, both ways, at every venue, ordered by venue, direction and rung', async () => {
    const venues = [buildVenueAdapter(), buildVenueAdapter({ id: VenueId.Aquarius })];

    const quotes = await takeQuotes(venues, [pair], [100n, 250n], tickingClock('2026-11-27T04:43:38.000Z'));

    expect(quotes.map(({ venue, direction, amountIn }) => [venue, direction, amountIn])).toEqual([
      ['sdex', 'base_to_quote', 1_000_000_000n],
      ['sdex', 'base_to_quote', 2_500_000_000n],
      ['sdex', 'quote_to_base', 10_000n],
      ['sdex', 'quote_to_base', 25_000n],
      ['aquarius', 'base_to_quote', 1_000_000_000n],
      ['aquarius', 'base_to_quote', 2_500_000_000n],
      ['aquarius', 'quote_to_base', 10_000n],
      ['aquarius', 'quote_to_base', 25_000n],
    ]);
  });

  it('keeps what each venue answered, with the time the collector clock gave for it', async () => {
    const timeout = { status: QuoteStatus.Error as const, cause: QuoteErrorCause.Timeout, reason: 'no answer' };
    const failing = buildVenueAdapter({ id: VenueId.Soroswap, quote: () => Promise.resolve(timeout) });

    const quotes = await takeQuotes([failing], [pair], [100n], tickingClock('2026-11-27T04:43:38.000Z'));

    expect(quotes).toEqual([
      expect.objectContaining({ direction: 'base_to_quote', quote: timeout }),
      expect.objectContaining({ direction: 'quote_to_base', quote: timeout }),
    ]);
    expect(quotes.map(({ quotedAt }) => quotedAt).sort((a, b) => a.getTime() - b.getTime())).toEqual([
      new Date('2026-11-27T04:43:38.000Z'),
      new Date('2026-11-27T04:43:39.000Z'),
    ]);
  });

  it('has one request open per ladder at a time, and every ladder open at once', async () => {
    const open = new Map<string, number>();
    let openAtOnce = 0;
    let mostOpenInALadder = 0;
    const counting = (id: VenueId): VenueAdapter => {
      const venue = buildVenueAdapter({ id });

      return {
        ...venue,
        quote: async (quotedPair, direction: Direction, amountIn) => {
          const ladder = `${id} ${direction}`;
          open.set(ladder, (open.get(ladder) ?? 0) + 1);
          mostOpenInALadder = Math.max(mostOpenInALadder, ...open.values());
          openAtOnce = Math.max(openAtOnce, [...open.values()].reduce((sum, count) => sum + count, 0));
          await new Promise((resolve) => setImmediate(resolve));
          open.set(ladder, (open.get(ladder) ?? 0) - 1);

          return venue.quote(quotedPair, direction, amountIn);
        },
      };
    };

    await takeQuotes(
      [counting(VenueId.Sdex), counting(VenueId.Soroswap), counting(VenueId.Aquarius)],
      [pair],
      [100n, 250n, 500n],
      tickingClock('2026-11-27T04:43:38.000Z'),
    );

    expect({ mostOpenInALadder, openAtOnce }).toEqual({ mostOpenInALadder: 1, openAtOnce: 6 });
  });
});
