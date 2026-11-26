# Horizon fixtures

Bodies `https://horizon.stellar.org` sent on 2026-11-26, saved byte for byte. Every request is
`GET /paths/strict-send`. The adapter tests in `packages/venues` answer with these files.

| File | Request | Status | `Latest-Ledger` |
|---|---|---|---|
| `strict-send.usdc-eurc.100.json` | 100 USDC to EURC | 200 | 65680158 |
| `strict-send.eurc-usdc.100000.json` | 100,000 EURC to USDC | 200 | 65680159 |
| `strict-send.usdc-eurc.two-paths.json` | 100,000,000,000 USDC to EURC, far more than the market holds, so Horizon lists two paths | 200 | 65680159 |
| `strict-send.no-route.json` | 100 USDC to `NOPE` from the EURC issuer, an asset with no market | 200 | 65680159 |
| `strict-send.bad-request.json` | 0 USDC to EURC | 400 | 65680160 |

USDC is `USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN` and EURC is
`EURC:GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2`, as in `config/pairs.json`.

To record one again:

```sh
curl -sS -D - -o strict-send.usdc-eurc.100.json \
  'https://horizon.stellar.org/paths/strict-send?source_asset_type=credit_alphanum4&source_asset_code=USDC&source_asset_issuer=GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN&source_amount=100.0000000&destination_assets=EURC%3AGDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2'
```

The amounts change with the market, so a new recording needs the expected values in the tests updated.
