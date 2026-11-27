import {
  baseReference,
  Fiat,
  referenceState,
  ReferenceState,
  ReferenceStatus,
  type ReferenceReading,
} from '@fair-fx/core';
import { buildReferencePrice, WEEKEND_WINDOW } from '@fair-fx/core/testing';

// Unix seconds. The market is open on the Wednesday and closed on the Saturday, by WEEKEND_WINDOW.
const WEDNESDAY_NOON = 1_795_608_000; // 2026-11-25 12:00:00 UTC
const WEDNESDAY_900_S_LATER = 1_795_608_900;
const WEDNESDAY_901_S_LATER = 1_795_608_901;
const SATURDAY_NOON = 1_795_867_200; // 2026-11-28 12:00:00 UTC
const SATURDAY_900_S_LATER = 1_795_868_100;
const SATURDAY_901_S_LATER = 1_795_868_101;

const MISSING: ReferenceReading = { status: ReferenceStatus.Missing, fiat: Fiat.Eur };
const UNAVAILABLE: ReferenceReading = { status: ReferenceStatus.Unavailable, fiat: Fiat.Eur, reason: 'timeout' };

describe('referenceState', () => {
  it.each([
    { what: 'a price 900 s old in open hours', setAt: WEDNESDAY_NOON, now: WEDNESDAY_900_S_LATER, state: 'fresh' },
    { what: 'a price 901 s old in open hours', setAt: WEDNESDAY_NOON, now: WEDNESDAY_901_S_LATER, state: 'unknown' },
    { what: 'a price 900 s old in closed hours', setAt: SATURDAY_NOON, now: SATURDAY_900_S_LATER, state: 'closed' },
    { what: 'a price 901 s old in closed hours', setAt: SATURDAY_NOON, now: SATURDAY_901_S_LATER, state: 'unknown' },
  ])('gives $state for $what', ({ setAt, now, state }) => {
    const price = buildReferencePrice({ oracleTime: setAt });

    const result = referenceState([price], WEEKEND_WINDOW, now);

    expect(result).toBe(state);
  });

  it.each([
    { what: 'a feed with no price, in open hours', reading: MISSING, now: WEDNESDAY_NOON },
    { what: 'a feed with no price, in closed hours', reading: MISSING, now: SATURDAY_NOON },
    { what: 'a feed that did not answer, in closed hours', reading: UNAVAILABLE, now: SATURDAY_NOON },
  ])('gives unknown for $what', ({ reading, now }) => {
    const result = referenceState([reading], WEEKEND_WINDOW, now);

    expect(result).toBe(ReferenceState.Unknown);
  });

  it('gives unknown when one of two currencies has no price', () => {
    const eur = buildReferencePrice({ oracleTime: WEDNESDAY_NOON });

    const result = referenceState([eur, MISSING], WEEKEND_WINDOW, WEDNESDAY_NOON);

    expect(result).toBe(ReferenceState.Unknown);
  });

  it('gives unknown for a run that read no reference', () => {
    const result = referenceState([], WEEKEND_WINDOW, WEDNESDAY_NOON);

    expect(result).toBe(ReferenceState.Unknown);
  });

  it('gives fresh for the base currency, which never ages', () => {
    const result = referenceState([baseReference()], WEEKEND_WINDOW, WEDNESDAY_NOON);

    expect(result).toBe(ReferenceState.Fresh);
  });

  it('gives fresh on a Saturday when the market has no closed hours', () => {
    const price = buildReferencePrice({ oracleTime: SATURDAY_NOON });

    const result = referenceState([price], null, SATURDAY_NOON);

    expect(result).toBe(ReferenceState.Fresh);
  });
});
