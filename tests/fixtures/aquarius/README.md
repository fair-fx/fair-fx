# Aquarius fixtures

Bodies `https://amm-api.aqua.network` sent on 2026-11-26, saved byte for byte. Every request is a
`POST` of a find-path request as JSON. The adapter tests in `packages/venues` answer with these files.

| File | Request | Status | Answer |
|---|---|---|---|
| `find-path.usdc-eurc.100.json` | 100 USDC to EURC | 200 | `919252118`, two pools through sUSD |
| `find-path.usdc-eurc.100.slippage.json` | The same, with `"slippage": "0.01"` | 200 | `amount` is `919252118`, `amount_with_fee` is `910059596` |
| `find-path.eurc-usdc.100000.json` | 100,000 EURC to USDC | 200 | `267930385595`, two pools through sUSD |
| `find-path.usdc-eurc.1-stroop.json` | 0.0000001 USDC to EURC | 200 | `success: false`, every other field empty or zero |
| `find-path.unknown-token.json` | 100 USDC to the Reflector fiat feed, which is no token | 400 | `token_out_address`: "Object with address=... does not exist." |
| `find-path.missing-token.json` | 100 USDC, with no token to pay out named | 400 | `token_out_address`: "This field is required." |
| `find-path.pools.usdc-eurc.100.json` | 100 USDC to EURC, sent to `/pools/find-path/` | 200 | `"918572852.000000000000000000"`, two pools through sUSD |

The first four files answer `/api/external/v2/find-path/`, the endpoint in `config/networks.json`. It
is the one Aquarius documents, in the schema at `https://amm-api.aqua.network/api/schema/`, and it
sends amounts as JSON integers.

`/pools/find-path/` is the endpoint FairFX asked before. The schema does not list it. Asked for 100
USDC to EURC at the same moment, it gave the same path and the same amount as the documented one, with
the amount as a decimal string with 18 decimal places. The adapter still reads those, and the last
file is what keeps that reading tested. The two 400 files were recorded from it as well, and
`/api/external/v2/find-path/` sent the same bytes for both requests.

`amount` is the output Aquarius estimates. `amount_with_fee` is `amount` lowered by the `slippage` and
the `provider_fee` of the request: the schema calls it the minimum-received bound. The adapter sends
neither field, so the two are equal in every answer it gets, and it reads `amount`. The slippage file
answers a request the adapter never sends. It is here to show the two amounts apart.

USDC is `CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75` and EURC is
`CDTKPWPLOURQA2SGTKTUQOWRCBZEORB4BWBOMJ3D3ZTQQSGE5F6JBQLV`, as in `config/pairs.json`. sUSD is
`CDFZUVS5YNLXU7VENKOUDEOHCJGKQNVUBWD7KMN6E7ZROKPYPFLRUJFG`.

Aquarius answers a token it does not list with a 400, and the adapter reads that one refusal as
`no_route`. Any other 400 is an error, which is what `find-path.missing-token.json` is for.

Not recorded: a found path that pays zero, an amount with a fraction that is not zero, and an amount
too large for a JSON number. Aquarius sent none of them, so the tests that need them build the body by
hand. The schema says `success` is false whenever the output is zero.

To record one again:

```sh
USDC=CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75
EURC=CDTKPWPLOURQA2SGTKTUQOWRCBZEORB4BWBOMJ3D3ZTQQSGE5F6JBQLV

curl -sS -o find-path.usdc-eurc.100.json -X POST https://amm-api.aqua.network/api/external/v2/find-path/ \
  -H 'content-type: application/json' \
  -d "{\"token_in_address\":\"$USDC\",\"token_out_address\":\"$EURC\",\"amount\":\"1000000000\"}"
```

The amounts change with the pools, so a new recording needs the expected values in the tests updated.
