# Soroban RPC fixtures

Bodies `https://mainnet.sorobanrpc.com` sent on 2026-11-26, saved byte for byte. Every request is a
JSON-RPC `simulateTransaction` of one contract call, answered with status 200 at ledger 65681036.
The adapter tests in `packages/venues` answer with these files.

| File | Contract call | Answer |
|---|---|---|
| `simulate.soroswap.usdc-eurc.100.json` | router `router_get_amounts_out`, 100 USDC, path USDC then EURC | `[1000000000, 917323955]` |
| `simulate.soroswap.eurc-usdc.100000.json` | the same call, 100,000 EURC, path EURC then USDC | `[1000000000000, 775303511663]` |
| `simulate.soroswap.usdc-eurc.1-stroop.json` | the same call, 0.0000001 USDC | `[1, 0]` |
| `simulate.soroswap.overflow.json` | the same call, 10^30 stroops of USDC | `HostError: Error(WasmVm, InvalidAction)` |
| `simulate.soroswap.no-pair.json` | the same call, 100 USDC, path USDC then the Reflector fiat feed, which is no token and has no pair | `HostError: Error(Storage, MissingValue)` |
| `simulate.soroswap.get-factory.json` | router `get_factory` | the factory address |
| `simulate.not-deployed.get-amounts-out.json` | `router_get_amounts_out` on an address where nothing is deployed | `HostError: Error(Storage, MissingValue)` |
| `simulate.not-deployed.get-factory.json` | `get_factory` on the same address | `HostError: Error(Storage, MissingValue)` |

The router is `CAG5LRYQ5JVEUI5TEID72EYOVX44TTUJT5BQR2J6J77FH65PCCFAJDDH`, as in `config/networks.json`.
USDC is `CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75` and EURC is
`CDTKPWPLOURQA2SGTKTUQOWRCBZEORB4BWBOMJ3D3ZTQQSGE5F6JBQLV`, as in `config/pairs.json`. The address
with nothing deployed is `CBOTBYBQC62LRQ2KZVBWRFMLYF6S3JML36Z2C2LI7ZRYXWRJLKAV47NY`.

A missing pair and a missing router fail with the same error. Only the `events` in the two files
tell them apart, which is why the adapter asks the router a second question before it answers.

Not recorded: the router's error 511, an existing pair with an empty reserve. No such pair was found
on mainnet, so the test that needs it builds the answer by hand.

To record one again, send the transaction the adapter builds. This is the first file:

```sh
curl -sS -o simulate.soroswap.usdc-eurc.100.json https://mainnet.sorobanrpc.com \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"simulateTransaction","params":{"transaction":"AAAAAgAAAAA7mRE4Dv6Yi6CokA6xz+RPNm99vpRr7QdyQPf2JN8VxQAAAGQAAAAAAAAAAQAAAAEAAAAAAAAAAAAAAABrCBMOAAAAAAAAAAEAAAAAAAAAGAAAAAAAAAABDdXHEOpqSiOzIgf9Ew6t+cnOiZ9DCOk+T/5T+68QigQAAAAWcm91dGVyX2dldF9hbW91bnRzX291dAAAAAAAAgAAAAoAAAAAAAAAAAAAAAA7msoAAAAAEAAAAAEAAAACAAAAEgAAAAGt785ZruUpaPdgYdSUwlJbdWWfpClqZfSZ7ynlZHfklgAAABIAAAAB5qfZ63UjAGpGmqdIOtEQckdEPA2C5idj3mcISMTpfJAAAAAAAAAAAAAAAAA="}}'
```

The amounts change with the pool, so a new recording needs the expected values in the tests updated.
