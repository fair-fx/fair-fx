import { slotOf } from '@fair-fx/collector';

describe('slotOf', () => {
  it.each([
    { what: 'the first millisecond of a slot', instant: '2026-11-26T08:55:00.000Z', slot: '2026-11-26T08:55:00.000Z' },
    { what: 'the middle of a slot', instant: '2026-11-26T08:57:31.250Z', slot: '2026-11-26T08:55:00.000Z' },
    { what: 'the last millisecond of a slot', instant: '2026-11-26T08:59:59.999Z', slot: '2026-11-26T08:55:00.000Z' },
    { what: 'the first millisecond after it', instant: '2026-11-26T09:00:00.000Z', slot: '2026-11-26T09:00:00.000Z' },
  ])('puts $what in the slot that starts at $slot', ({ instant, slot }) => {
    const now = new Date(instant);

    const start = slotOf(now);

    expect(start).toEqual(new Date(slot));
  });
});
