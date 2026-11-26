# Venue adapters: input, output and how each answer is handled

`packages/venues` has one adapter per venue. Each one turns "what would this swap pay?" into the
venue's own request, and turns whatever comes back into one shape.

Everything shown here came out of the adapter code on 2026-11-26. The source of each case is marked:

- **Recorded**: the venue's real answer, saved byte for byte in `tests/fixtures/`, replayed to the adapter.
- **Built**: an answer the venue never sent us, written by hand in a test.
- **Simulated**: a failure of the transport (a timeout, a failed DNS lookup), made by a fake `fetch`.
- **Live**: a call to mainnet, in section 5.

## 1. One shape for every venue

Input, the same for the three adapters:

```ts
adapter.quote(pair, direction, amountIn)
```

| Argument | What it is | Example |
| --- | --- | --- |
| `pair` | Two assets from `config/pairs.json`, each with its code, issuer, contract and decimals | USDC/EURC |
| `direction` | Which side is spent | `base_to_quote` spends USDC, `quote_to_base` spends EURC |
| `amountIn` | An integer in the smallest unit of the token spent | `1000000000n` is 100 USDC (7 decimals) |

The two assets of every example below, as `config/pairs.json` pins them:

| Asset | Issuer (classic) | Contract (Soroban) |
| --- | --- | --- |
| USDC | `GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN` | `CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75` |
| EURC | `GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2` | `CDTKPWPLOURQA2SGTKTUQOWRCBZEORB4BWBOMJ3D3ZTQQSGE5F6JBQLV` |

Output, one of three:

```ts
{status: 'ok', amountOut: 918509809n, route: {path: []}, ledger: 65680158}
{status: 'no_route', cause: 'no_path'}
{status: 'error', cause: 'rejected', reason: 'horizon answered 400: Bad Request (Amount must be positive)'}
```

| Status | Meaning | `cause` |
| --- | --- | --- |
| `ok` | The venue would pay `amountOut`, always above zero. `route` is what the venue needs to make that swap, `ledger` the ledger the answer is from, or `null` when the venue does not say | none |
| `no_route` | The venue answered, and it has no way to make this swap | `no_path`, `unlisted_token`, `pays_nothing` |
| `error` | There is no usable answer. `reason` holds the detail as text | `bad_request`, `timeout`, `network`, `unavailable`, `rejected`, `bad_answer`, `unknown` |

Rules every adapter keeps:

- **It never throws.** A failure is a status, so one venue that is down cannot stop a run.
- **A failure is never a zero amount.** Zero would read as "this venue pays nothing" and distort every
  comparison. A path that pays zero is `no_route`.
- **Amounts are integers.** No floating point anywhere: a decimal string from a venue is read digit by
  digit, and a number too large to be exact is refused.
- **An amount in of zero or less is refused before the venue is asked** (`bad_request`).
- **Every request has a timeout**, 10 seconds unless the caller sets another.
- **HTTP errors are sorted by what to do next.** 429 and 5xx are `unavailable`: the same request may work
  later. Any other status is `rejected`: waiting is not expected to help.

## 2. SDEX and the Classic AMM, through Horizon

Horizon finds paths over the order books and the classic liquidity pools together, so this is one adapter.

**Asks** (100 USDC to EURC):

```text
GET https://horizon.stellar.org/paths/strict-send
  ?source_asset_type=credit_alphanum4
  &source_asset_code=USDC
  &source_asset_issuer=GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN
  &source_amount=100.0000000
  &destination_assets=EURC%3AGDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2
```

**Horizon answers** (recorded, with the header `Latest-Ledger: 65680158`):

```json
{
  "_embedded": {
    "records": [
      {
        "source_asset_type": "credit_alphanum4",
        "source_asset_code": "USDC",
        "source_asset_issuer": "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
        "source_amount": "100.0000000",
        "destination_asset_type": "credit_alphanum4",
        "destination_asset_code": "EURC",
        "destination_asset_issuer": "GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2",
        "destination_amount": "91.8509809",
        "path": []
      }
    ]
  }
}
```

**The adapter returns:**

```ts
{status: 'ok', amountOut: 918509809n, route: {path: []}, ledger: 65680158}
```

`"91.8509809"` became `918509809n`, 91.8509809 EURC in stroops. `path: []` is a direct trade.

| Horizon answers | The adapter returns | Why | Source |
| --- | --- | --- | --- |
| One path | `{status: 'ok', amountOut: 918509809n, route: {path: []}, ledger: 65680158}` | The ledger is read from the `Latest-Ledger` header, and is `null` when Horizon does not send it | Recorded |
| Two paths: 19,841.7316833 EURC through XLM, 2,176.1302182 direct | `{status: 'ok', amountOut: 198417316833n, route: {path: ['native']}, ledger: 65680159}` | Horizon may list several paths. The one that pays the most is taken, wherever it is in the list | Recorded |
| `"records": []` | `{status: 'no_route', cause: 'no_path'}` | No path is an answer, not a failure | Recorded |
| A path that pays `"0.0000000"` | `{status: 'no_route', cause: 'pays_nothing'}` | Kept apart from "no path": here a path exists and the amount is too small for it | Built |
| HTTP 400 with Horizon's problem body | `{status: 'error', cause: 'rejected', reason: 'horizon answered 400: Bad Request (Amount must be positive)'}` | The reason Horizon gave is kept in `reason` | Recorded |
| HTTP 502 with an HTML page | `{status: 'error', cause: 'unavailable', reason: 'horizon answered 502'}` | The body is not JSON, so only the status is reported | Simulated |
| A 200 whose body is not JSON, has no records, or holds an amount that is not a decimal number | `status: 'error', cause: 'bad_answer'`, with the field that is wrong in `reason` | An answer that cannot be read is never guessed at | Built |
| Nothing within the timeout | `{status: 'error', cause: 'timeout', reason: 'timed out after 1 ms'}` | The test sets the timeout to 1 ms | Simulated |
| The request cannot be made | `{status: 'error', cause: 'network', reason: 'fetch failed: getaddrinfo ENOTFOUND venue.invalid'}` | The cause the runtime gave is kept | Simulated |

## 3. Soroswap, through its router contract

The adapter simulates a read of the router over Soroban RPC. No transaction is signed or submitted:
a simulation costs no fee and changes no state.

**Asks** (a `simulateTransaction` request holding this contract call):

```json
{
  "contract_address": "CAG5LRYQ5JVEUI5TEID72EYOVX44TTUJT5BQR2J6J77FH65PCCFAJDDH",
  "function_name": "router_get_amounts_out",
  "args": [
    { "i128": "1000000000" },
    { "vec": [{ "address": "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75" }, { "address": "CDTKPWPLOURQA2SGTKTUQOWRCBZEORB4BWBOMJ3D3ZTQQSGE5F6JBQLV" }] }
  ]
}
```

The two addresses are the USDC and EURC contracts: FairFX asks for the direct pair only.

**The router answers** (recorded, at ledger 65681036):

```text
[1000000000, 917323955]
```

**The adapter returns:**

```ts
{
  status: 'ok',
  amountOut: 917323955n,
  route: { path: ['CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75', 'CDTKPWPLOURQA2SGTKTUQOWRCBZEORB4BWBOMJ3D3ZTQQSGE5F6JBQLV'] },
  ledger: 65681036
}
```

| The simulation answers | The adapter returns | Why | Source |
| --- | --- | --- | --- |
| `[1000000000, 917323955]` | `status: 'ok', amountOut: 917323955n, ledger: 65681036` | The ledger is the latest one the RPC node knew when it ran the simulation | Recorded |
| `[1, 0]`, for 1 stroop | `{status: 'no_route', cause: 'pays_nothing'}` | The pool exists and pays nothing for an amount this small | Recorded |
| `HostError: Error(Storage, MissingValue)`, then the router answers `get_factory` | `{status: 'no_route', cause: 'no_path'}` | This error has two meanings: a pair nobody created, or an address that is no router. A second read of the router tells them apart | Recorded |
| The same error, and `get_factory` fails the same way | `{status: 'error', cause: 'rejected', reason: 'no Soroswap router answers at CBOTBYBQC62LRQ2KZVBWRFMLYF6S3JML36Z2C2LI7ZRYXWRJLKAV47NY: HostError: Error(Storage, MissingValue)'}` | A wrong router address is a fault in the setup. It must not look like "no route" | Recorded |
| `HostError: Error(Contract, #511)` | `{status: 'no_route', cause: 'no_path'}` | The router's own error for a pair with an empty reserve. No empty pool was found on mainnet to record | Built |
| `HostError: Error(WasmVm, InvalidAction)`, for 10^30 stroops | `{status: 'error', cause: 'rejected', reason: 'HostError: Error(WasmVm, InvalidAction)'}` | An amount too large for the pool's arithmetic | Recorded |
| HTTP 502 from the RPC node | `{status: 'error', cause: 'unavailable', reason: 'Request failed with status code 502'}` | The node is at fault, not the router. The same holds when the second read cannot be made | Simulated |
| Nothing within the timeout | `{status: 'error', cause: 'timeout', reason: 'timeout of 1 ms exceeded'}` | The test sets the timeout to 1 ms. It bounds each read | Simulated |
| The request cannot be made | `{status: 'error', cause: 'network', reason: 'fetch failed'}` | The Stellar SDK drops the detail, so only its message is left | Simulated |

## 4. Aquarius, through its find-path API

**Asks** (`POST https://amm-api.aqua.network/api/external/v2/find-path/`):

```text
{
  "token_in_address": <the USDC contract>,
  "token_out_address": <the EURC contract>,
  "amount": "1000000000"
}
```

The two contracts are the ones in the table of section 1, sent as text. The amount is sent as text too,
so JSON keeps every digit.

**Aquarius answers** (recorded, the swap chain shortened here):

```json
{
  "success": true,
  "swap_chain_xdr": "AAAAEAAAAAEAAAACAAAAEAAA...",
  "pools": [
    "CDD3OQDUVL3ITL4ZJF27WVSO65PFEQQ5AOHEUPUHC7YNL7VUYM4QRLZ5",
    "CCPN4NNSQKL3LLPTSPTFKYKXR3FBL37AULE6PTZH3QD24MPHXQCN5O3U"
  ],
  "tokens": [
    "USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    "sUSD:GCHW7CWI7GMIYQYFXMFJNJX5645XGWIINIAEQK3SABQO6CAYL5T7JYIH",
    "EURC:GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2"
  ],
  "tokens_addresses": [
    "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75",
    "CDFZUVS5YNLXU7VENKOUDEOHCJGKQNVUBWD7KMN6E7ZROKPYPFLRUJFG",
    "CDTKPWPLOURQA2SGTKTUQOWRCBZEORB4BWBOMJ3D3ZTQQSGE5F6JBQLV"
  ],
  "amount": 919252118,
  "amount_with_fee": 919252118
}
```

**The adapter returns:**

```ts
{
  status: 'ok',
  amountOut: 919252118n,
  route: {
    swapChainXdr: 'AAAAEAAAAAEAAAACAAAAEAAA...',
    pools: [
      'CDD3OQDUVL3ITL4ZJF27WVSO65PFEQQ5AOHEUPUHC7YNL7VUYM4QRLZ5',
      'CCPN4NNSQKL3LLPTSPTFKYKXR3FBL37AULE6PTZH3QD24MPHXQCN5O3U'
    ],
    tokens: [
      'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75',
      'CDFZUVS5YNLXU7VENKOUDEOHCJGKQNVUBWD7KMN6E7ZROKPYPFLRUJFG',
      'CDTKPWPLOURQA2SGTKTUQOWRCBZEORB4BWBOMJ3D3ZTQQSGE5F6JBQLV'
    ]
  },
  ledger: null
}
```

The route is kept as Aquarius gave it: the swap chain is what its router needs to make the swap, and it is
passed on unchanged. This path goes through two pools, USDC to sUSD to EURC.

| Aquarius answers | The adapter returns | Why | Source |
| --- | --- | --- | --- |
| `"success": true, "amount": 919252118` | `status: 'ok', amountOut: 919252118n, ledger: null` | Aquarius prices from the pool state it has indexed and does not say at which ledger, so the ledger is `null` and not a guess | Recorded |
| `"amount": 919252118, "amount_with_fee": 910059596`, to a request that allows 1 percent slippage | `amountOut: 919252118n` | `amount` is what the venue estimates it pays. `amount_with_fee` is the least a swap should accept, a bound and not a quote, so it is not read | Recorded |
| `"amount": "918572852.000000000000000000"`, from the endpoint asked before | `amountOut: 918572852n` | Both forms of an amount are read: a JSON integer and a decimal string | Recorded |
| `"success": false`, for 1 stroop | `{status: 'no_route', cause: 'no_path'}` | Aquarius answers an amount too small for its pools the same way as a missing pool, so the adapter cannot say more than "no path" | Recorded |
| HTTP 400: `Object with address=... does not exist.` | `{status: 'no_route', cause: 'unlisted_token'}` | The one refusal that means "no market here", not a broken request | Recorded |
| HTTP 400: `This field is required.` | `{status: 'error', cause: 'rejected', reason: 'aquarius answered 400: token_out_address: This field is required.'}` | Any other 400 is an error, with what Aquarius said about each field | Recorded |
| An amount as a JSON number of 2^53 or more | `status: 'error', cause: 'bad_answer'` | Such a number has already lost digits when it is parsed, so it is refused, not rounded | Built |
| HTTP 502 with an HTML page | `{status: 'error', cause: 'unavailable', reason: 'aquarius answered 502'}` | As for Horizon | Simulated |
| Nothing within the timeout | `{status: 'error', cause: 'timeout', reason: 'timed out after 1 ms'}` | The test sets the timeout to 1 ms | Simulated |

## 5. The same request to the three venues, live

100 USDC to EURC on mainnet, asked through the three adapters on 2026-11-26 at 16:49 UTC:

| Venue | `amountOut` | In EURC | `ledger` | Route |
| --- | --- | --- | --- | --- |
| SDEX and Classic AMM | `921705342n` | 92.1705342 | 65685138 | direct |
| Soroswap | `917404892n` | 91.7404892 | 65685138 | the USDC/EURC pool |
| Aquarius | `919081674n` | 91.9081674 | `null` | two pools, through sUSD |

This is one moment and one amount. The numbers move with every ledger, and a quote is what a venue says it
would pay, not an executed trade. Comparing them with the FX rate is the job of the rate math and the
collector, and the collector is not built yet.

## 6. Check it yourself

Every row above has a test. The names read as the behaviour:

```sh
pnpm --filter @fair-fx/venues test sdex --reporter=verbose
pnpm --filter @fair-fx/venues test soroswap --reporter=verbose
pnpm --filter @fair-fx/venues test aquarius --reporter=verbose
```

- The recorded answers are in `tests/fixtures/horizon/`, `tests/fixtures/soroban-rpc/` and
  `tests/fixtures/aquarius/`. Each folder has a README with the request behind every file and the `curl`
  command to record it again.
- The live calls are `pnpm test:smoke`. They check that each venue quotes 100 USDC inside a plausible
  range, and do not print the amount.
- [`test-output.md`](test-output.md) lists every test with its result.
