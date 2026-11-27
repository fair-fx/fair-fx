import { LedgerStatus, toLedgerReading } from '@fair-fx/core';
import { LATEST_LEDGER_ANSWER } from '@fair-fx/core/testing';

describe('toLedgerReading', () => {
  it('returns the sequence and the close time in seconds', () => {
    const reading = toLedgerReading(LATEST_LEDGER_ANSWER);

    expect(reading).toEqual({
      status: LedgerStatus.Ok,
      sequence: 65_693_709,
      closeTime: 1_795_754_616, // Unix seconds: 2026-11-27 04:43:36 UTC
    });
  });

  it.each([
    { what: 'a close time that is a date', answer: { ...LATEST_LEDGER_ANSWER, closeTime: '2026-11-27T04:43:36Z' } },
    { what: 'a close time that is a number', answer: { ...LATEST_LEDGER_ANSWER, closeTime: 1_795_754_616 } },
    { what: 'a close time with a fraction', answer: { ...LATEST_LEDGER_ANSWER, closeTime: '1795754616.5' } },
    { what: 'a close time in exponent form', answer: { ...LATEST_LEDGER_ANSWER, closeTime: '1.795754616e9' } },
    { what: 'a negative close time', answer: { ...LATEST_LEDGER_ANSWER, closeTime: '-1795754616' } },
    { what: 'a close time of zero', answer: { ...LATEST_LEDGER_ANSWER, closeTime: '0' } },
    { what: 'an empty close time', answer: { ...LATEST_LEDGER_ANSWER, closeTime: '' } },
    { what: 'a close time past the safe integers', answer: { ...LATEST_LEDGER_ANSWER, closeTime: '9007199254740993' } },
    { what: 'an answer without a close time', answer: { sequence: 65_693_709 } },
    { what: 'a sequence of zero', answer: { ...LATEST_LEDGER_ANSWER, sequence: 0 } },
    { what: 'a sequence with a fraction', answer: { ...LATEST_LEDGER_ANSWER, sequence: 65_693_709.5 } },
    { what: 'a sequence that is a string', answer: { ...LATEST_LEDGER_ANSWER, sequence: '65693709' } },
    { what: 'an answer without a sequence', answer: { closeTime: '1795754616' } },
    { what: 'no answer', answer: undefined },
    { what: 'a null answer', answer: null },
  ])('reports $what as invalid', ({ answer }) => {
    const reading = toLedgerReading(answer);

    expect(reading).toEqual({ status: LedgerStatus.Invalid, reason: expect.stringMatching(/^latest ledger: /) });
  });
});
