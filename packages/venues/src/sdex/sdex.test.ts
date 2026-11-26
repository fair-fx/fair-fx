import { NoRouteCause, QuoteStatus } from '@fair-fx/core';
import { EURC, USDC } from '@fair-fx/core/testing';
import { strictSendUrl, toSdexQuote } from '@fair-fx/venues';
import { buildStrictSendRecord, buildStrictSendResponse } from '@fair-fx/venues/testing';

const XLM_THEN_EURC = [
  { asset_type: 'native' },
  { asset_type: 'credit_alphanum4', asset_code: EURC.code, asset_issuer: EURC.issuer },
];

describe('strictSendUrl', () => {
  it('asks what an amount of the input token pays in the output token', () => {
    const url = strictSendUrl('https://horizon.stellar.org', { input: USDC, output: EURC }, 1_000_000_000n); // 100 USDC

    expect(url.href).toBe(
      'https://horizon.stellar.org/paths/strict-send' +
        '?source_asset_type=credit_alphanum4' +
        '&source_asset_code=USDC' +
        '&source_asset_issuer=GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN' +
        '&source_amount=100.0000000' +
        '&destination_assets=EURC%3AGDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2',
    );
  });

  it('names an input code longer than 4 characters as credit_alphanum12', () => {
    const eurcv = { ...EURC, code: 'EURCV' };

    const url = strictSendUrl('https://horizon.stellar.org', { input: eurcv, output: USDC }, 1n);

    expect(url.searchParams.get('source_asset_type')).toBe('credit_alphanum12');
  });

  it('keeps the path of a Horizon that is not at the root of its host', () => {
    const url = strictSendUrl('https://rpc.example.org/stellar_horizon', { input: USDC, output: EURC }, 1n);

    expect(url.pathname).toBe('/stellar_horizon/paths/strict-send');
  });
});

describe('toSdexQuote', () => {
  it('returns the amount in stroops, the path and the ledger of the answer', () => {
    const response = buildStrictSendResponse([buildStrictSendRecord({ path: XLM_THEN_EURC })]);

    const quote = toSdexQuote(response);

    expect(quote).toEqual({
      status: QuoteStatus.Ok,
      amountOut: 918_509_809n, // 91.8509809 EURC
      route: { path: ['native', { code: 'EURC', issuer: EURC.issuer }] },
      ledger: 65_680_158,
    });
  });

  it('returns the path that pays the most when it is not listed first', () => {
    const response = buildStrictSendResponse([
      buildStrictSendRecord({ destination_amount: '91.0000000' }),
      buildStrictSendRecord({ destination_amount: '92.0000000' }),
    ]);

    const quote = toSdexQuote(response);

    expect(quote).toMatchObject({ status: QuoteStatus.Ok, amountOut: 920_000_000n });
  });

  it('returns no ledger when Horizon does not send the Latest-Ledger header', () => {
    const response = buildStrictSendResponse([buildStrictSendRecord()], { headers: new Headers() });

    const quote = toSdexQuote(response);

    expect(quote).toMatchObject({ status: QuoteStatus.Ok, ledger: null });
  });

  it.each([
    { what: 'Horizon lists no path', response: buildStrictSendResponse([]), cause: NoRouteCause.NoPath },
    {
      what: 'the only path pays nothing',
      response: buildStrictSendResponse([buildStrictSendRecord({ destination_amount: '0.0000000' })]),
      cause: NoRouteCause.PaysNothing,
    },
  ])('returns no_route and says why when $what', ({ response, cause }) => {
    const quote = toSdexQuote(response);

    expect(quote).toEqual({ status: QuoteStatus.NoRoute, cause });
  });

  it.each([
    {
      what: 'an amount that is not a decimal number',
      response: buildStrictSendResponse([buildStrictSendRecord({ destination_amount: '9.1e1' })]),
      reason: /^horizon response: .*expected a decimal amount/s,
    },
    {
      what: 'a body without records',
      response: buildStrictSendResponse([], { body: { _embedded: {} } }),
      reason: /^horizon response: /,
    },
    {
      what: 'a body that is not JSON',
      response: buildStrictSendResponse([], { body: null }),
      reason: /^horizon response: /,
    },
    {
      what: 'an HTTP error that names its cause',
      response: buildStrictSendResponse([], { status: 429, body: { title: 'Rate Limit Exceeded' } }),
      reason: /^horizon answered 429: Rate Limit Exceeded$/,
    },
    {
      what: 'an HTTP error with no Horizon body',
      response: buildStrictSendResponse([], { status: 503, body: null }),
      reason: /^horizon answered 503$/,
    },
  ])('reports $what as an error', ({ response, reason }) => {
    const quote = toSdexQuote(response);

    expect(quote).toEqual({ status: QuoteStatus.Error, reason: expect.stringMatching(reason) });
  });
});
