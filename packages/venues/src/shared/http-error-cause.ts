import { QuoteErrorCause } from '@fair-fx/core';
import { HTTP_SERVER_ERROR, HTTP_TOO_MANY_REQUESTS } from './http.constants.ts';

/**
 * What an HTTP status other than 200 says about a failed request: 429 and 5xx mean the venue cannot
 * answer now, any other status means it refused the request.
 */
export function httpErrorCause(status: number): QuoteErrorCause {
  const cannotAnswerNow = status === HTTP_TOO_MANY_REQUESTS || status >= HTTP_SERVER_ERROR;

  return cannotAnswerNow ? QuoteErrorCause.Unavailable : QuoteErrorCause.Rejected;
}
