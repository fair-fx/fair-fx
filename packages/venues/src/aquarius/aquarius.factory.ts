import type { JsonResponse } from '../shared/index.ts';

/**
 * The body of a find-path answer that found a path, with only the fields the adapter reads:
 * 91.8572852 EURC for USDC, through one pool.
 */
export function buildFoundPath(overrides: object = {}): object {
  return {
    success: true,
    swap_chain_xdr: 'AAAAEAAAAAEAAAAA',
    pools: ['CBV6LZABOAJRXHLIEKILTWBPC2AXLYVR4CGGPKZQ3PWJ5QFTPIWSWGWQ'],
    tokens_addresses: [
      'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75',
      'CDTKPWPLOURQA2SGTKTUQOWRCBZEORB4BWBOMJ3D3ZTQQSGE5F6JBQLV',
    ],
    amount: '918572852.000000000000000000',
    ...overrides,
  };
}

/** A 200 answer to a find-path request with `body`. */
export function buildFindPathResponse(body: unknown, overrides: Partial<JsonResponse> = {}): JsonResponse {
  return { status: 200, headers: new Headers(), body, ...overrides };
}
