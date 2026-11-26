# Aquarius fixtures

Bodies `https://amm-api.aqua.network` sent on 2026-11-26, saved byte for byte. Every request is a
`POST` of a find-path request as JSON. The adapter tests in `packages/venues` answer with these files.

| File | Endpoint | Request | Status | Answer |
|---|---|---|---|---|
| `find-path.usdc-eurc.100.json` | `/pools/find-path/` | 100 USDC to EURC | 200 | `"918572852.000000000000000000"`, two pools through sUSD |
| `find-path.eurc-usdc.100000.json` | `/pools/find-path/` | 100,000 EURC to USDC | 200 | `"284945534890.000000000000000000"`, two pools through sUSD |
| `find-path.usdc-eurc.1-stroop.json` | `/pools/find-path/` | 0.0000001 USDC to EURC | 200 | `success: false`, every other field empty or zero |
| `find-path.unknown-token.json` | `/pools/find-path/` | 100 USDC to the Reflector fiat feed, which is no token | 400 | `token_out_address`: "Object with address=... does not exist." |
| `find-path.missing-token.json` | `/pools/find-path/` | 100 USDC, with no token to pay out named | 400 | `token_out_address`: "This field is required." |
| `find-path.v2.usdc-eurc.100.json` | `/api/external/v2/find-path/` | 100 USDC to EURC | 200 | `918572852`, a JSON integer |

`/pools/find-path/` is the endpoint in `config/networks.json`. It sends amounts as decimal strings
with 18 decimal places. The endpoint the Aquarius documentation names is `/api/external/v2/find-path/`,
which answers the same request with amounts as JSON integers. The adapter reads both.

USDC is `CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75` and EURC is
`CDTKPWPLOURQA2SGTKTUQOWRCBZEORB4BWBOMJ3D3ZTQQSGE5F6JBQLV`, as in `config/pairs.json`. sUSD is
`CDFZUVS5YNLXU7VENKOUDEOHCJGKQNVUBWD7KMN6E7ZROKPYPFLRUJFG`.

Aquarius answers a token it does not list with a 400, and the adapter reads that one refusal as
`no_route`. The same request to `/api/external/v2/find-path/` gets the same body. Any other 400 is an
error, which is what `find-path.missing-token.json` is for.

Not recorded: an amount with a fraction that is not zero, and an amount too large for a JSON number.
Aquarius sent neither, so the tests that need them build the body by hand.

To record one again:

```sh
USDC=CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75
EURC=CDTKPWPLOURQA2SGTKTUQOWRCBZEORB4BWBOMJ3D3ZTQQSGE5F6JBQLV

curl -sS -o find-path.usdc-eurc.100.json -X POST https://amm-api.aqua.network/pools/find-path/ \
  -H 'content-type: application/json' \
  -d "{\"token_in_address\":\"$USDC\",\"token_out_address\":\"$EURC\",\"amount\":\"1000000000\"}"
```

The amounts change with the pools, so a new recording needs the expected values in the tests updated.
