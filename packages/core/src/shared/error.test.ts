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

  it('reads the errors inside an AggregateError that has no message of its own', () => {
    const refusedOnBothAddresses = new AggregateError([
      new Error('connect ECONNREFUSED ::1:5433'),
      new Error('connect ECONNREFUSED 127.0.0.1:5433'),
    ]);

    const message = errorMessageWithCause(refusedOnBothAddresses);

    expect(message).toBe('connect ECONNREFUSED ::1:5433; connect ECONNREFUSED 127.0.0.1:5433');
  });

  it('does not repeat a cause whose message is already in the message', () => {
    const missingFile = new Error('ENOENT: no such file or directory');
    const unreadableConfig = new Error('/srv/pairs.json: ENOENT: no such file or directory', { cause: missingFile });

    const message = errorMessageWithCause(unreadableConfig);

    expect(message).toBe('/srv/pairs.json: ENOENT: no such file or directory');
  });
});
