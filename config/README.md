# config

`pairs.json` is the only place a token is named. Code looks assets up by contract ID or by code and
issuer, never by code alone. Load both files with `loadConfig(dir, network)` from `@fair-fx/core/node`.

The ladder is in whole units of the input token, the same for every pair and both directions.

## Sources

Checked 2026-11-19 against primary sources:

| Value | Source |
|---|---|
| USDC and EURC issuers | https://www.circle.com/.well-known/stellar.toml |
| Soroswap router | https://raw.githubusercontent.com/soroswap/core/main/public/mainnet.contracts.json |
| Reflector fiat feed | https://developers.stellar.org/docs/data/oracles/oracle-providers ("Fiat exchange rates", Mainnet) |
| Asset contract IDs | Derived from code and issuer, checked by `packages/core/src/node/config.test.ts` |

`simulationSource` signs nothing. Any existing account works for read-only simulations; the USDC
issuer always exists.

A new pair needs the issuer confirmed from the issuer's own publication, a fiat symbol on the
reference feed, and a review in the PR.
