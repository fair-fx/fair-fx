import { readRunClock } from '@fair-fx/collector';
import { ledgerSourceAnswering } from '@fair-fx/collector/testing';
import { LATEST_LEDGER_ANSWER } from '@fair-fx/core/testing';

describe('readRunClock', () => {
  it('asks once more when the node cannot be reached, and reads the collector clock after the answer it uses', async () => {
    const events: string[] = [];
    const now = () => {
      events.push('clock');

      return new Date('2026-11-27T04:43:41.000Z');
    };

    const clock = await readRunClock(ledgerSourceAnswering(
        events,
        () => Promise.reject(new Error('fetch failed')),
        () => Promise.resolve(LATEST_LEDGER_ANSWER),
      ), now);

    expect(events).toEqual(['answer', 'answer', 'clock']);
    expect(clock).toEqual({ status: 'usable', sequence: 65_693_709, closeTime: 1_795_754_616, skewMilliseconds: -5_000 });
  });

  it('is unreadable, with the reason of the second failure, when the node cannot be reached twice', async () => {
    const events: string[] = [];

    const clock = await readRunClock(ledgerSourceAnswering(
        events,
        () => Promise.reject(new Error('fetch failed')),
        () => Promise.reject(new Error('timeout of 10000 ms exceeded')),
      ), () => new Date());

    expect(events).toEqual(['answer', 'answer']);
    expect(clock).toEqual({
      status: 'unreadable',
      failure: { status: 'unavailable', reason: 'timeout of 10000 ms exceeded' },
    });
  });

  it('does not ask again when the node answers something that is not a ledger', async () => {
    const events: string[] = [];

    const clock = await readRunClock(ledgerSourceAnswering(events, () => Promise.resolve({ ...LATEST_LEDGER_ANSWER, closeTime: 1_795_754_616 })), () => new Date());

    expect(events).toEqual(['answer']);
    expect(clock).toMatchObject({ status: 'unreadable', failure: { status: 'invalid' } });
  });
});
