# Test vectors

`rate-math.json` holds the cases the rate math must satisfy. The TypeScript tests in `packages/core`
read it, and the Rust tests of the contract will read the same file, so both stay on one definition.

- Integers are decimal strings, because they do not fit a JSON number. Decimals stay numbers.
- Amounts are in the token's smallest unit. Prices are USD with 14 decimals.
- `ref_out`, `shortfall_bps` and `floor` each list the cases that return a value (`returns`, with
  `expected`) and the cases that are refused (`refuses`, with `error`, the name of an `fx_guard`
  contract error).
- `snapshot_2026_11_09` rows are the quotes measured on mainnet that day, taken through the reference
  and the shortfall.
