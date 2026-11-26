import { errorMessageWithCause } from '@fair-fx/core';

describe('errorMessageWithCause', () => {
  it('reads the message of a thrown object that is not an Error', () => {
    const jsonRpcError = { code: -32602, message: 'invalid parameters' };

    const message = errorMessageWithCause(jsonRpcError);

    expect(message).toBe('invalid parameters');
  });

  it('falls back to the text of a thrown value with no message', () => {
    const message = errorMessageWithCause(503);

    expect(message).toBe('503');
  });

  it('adds the message of the cause', () => {
    const fetchFailed = new TypeError('fetch failed', { cause: new Error('getaddrinfo ENOTFOUND rpc.invalid') });

    const message = errorMessageWithCause(fetchFailed);

    expect(message).toBe('fetch failed: getaddrinfo ENOTFOUND rpc.invalid');
  });
});
