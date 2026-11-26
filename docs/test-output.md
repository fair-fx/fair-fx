# Recorded test output

The full output of the tests, recorded on 2026-11-26 from the `dev` branch at commit `a960b3a`, with
Node 26.8.1 on macOS. Each `✓` line is one test, named after the behaviour it checks. `↓` marks a live
test that the offline run skips. Your run shows your own folder and other times.

[`how-to-run-and-test.md`](how-to-run-and-test.md) has the steps.

## core: 136 passed, 2 skipped

```sh
pnpm --filter @fair-fx/core test --reporter=verbose
```

```text
$ vitest run --reporter=verbose

 RUN  v5.1.1 /path/to/fair-fx/packages/core

 ✓ src/shared/enum.test.ts > isEnumValue > accepts enum values and rejects enum keys 1ms
 ✓ src/shared/enum.test.ts > parseEnumValue > returns the typed value 0ms
 ✓ src/shared/enum.test.ts > parseEnumValue > names the field and the allowed values when it rejects 1ms
 ✓ src/shared/error.test.ts > errorMessageWithCause > reads the message of a thrown object that is not an Error 2ms
 ✓ src/shared/error.test.ts > errorMessageWithCause > falls back to the text of a thrown value with no message 0ms
 ✓ src/shared/error.test.ts > errorMessageWithCause > adds the message of the cause 0ms
 ✓ src/shared/decimal.test.ts > parseDecimalAmount > reads a Horizon amount 1ms
 ✓ src/shared/decimal.test.ts > parseDecimalAmount > reads a whole number 0ms
 ✓ src/shared/decimal.test.ts > parseDecimalAmount > reads fewer digits than decimals 0ms
 ✓ src/shared/decimal.test.ts > parseDecimalAmount > reads zero 0ms
 ✓ src/shared/decimal.test.ts > parseDecimalAmount > reads a long empty fraction 0ms
 ✓ src/shared/decimal.test.ts > parseDecimalAmount > cuts off digits past the decimals without rounding 0ms
 ✓ src/shared/decimal.test.ts > parseDecimalAmount > returns null for "" 0ms
 ✓ src/shared/decimal.test.ts > parseDecimalAmount > returns null for "abc" 0ms
 ✓ src/shared/decimal.test.ts > parseDecimalAmount > returns null for "-1" 0ms
 ✓ src/shared/decimal.test.ts > parseDecimalAmount > returns null for "1e5" 0ms
 ✓ src/shared/decimal.test.ts > parseDecimalAmount > returns null for "1." 0ms
 ✓ src/shared/decimal.test.ts > parseDecimalAmount > returns null for ".5" 0ms
 ✓ src/shared/decimal.test.ts > parseDecimalAmount > returns null for "1,5" 0ms
 ✓ src/shared/decimal.test.ts > parseDecimalAmount > returns null for " 1" 0ms
 ✓ src/shared/decimal.test.ts > formatDecimalAmount > writes 1000000000n with 7 decimals as 100.0000000 0ms
 ✓ src/shared/decimal.test.ts > formatDecimalAmount > writes 1n with 7 decimals as 0.0000001 0ms
 ✓ src/shared/decimal.test.ts > formatDecimalAmount > writes 0n with 7 decimals as 0.0000000 0ms
 ✓ src/shared/decimal.test.ts > formatDecimalAmount > writes 100n with 0 decimals as 100 0ms
 ✓ src/shared/decimal.test.ts > formatDecimalAmount > refuses a negative amount 0ms
 ✓ src/pair/pinned-lookup.test.ts > requirePinnedAsset > returns a pinned asset looked up by contract ID 2ms
 ✓ src/pair/pinned-lookup.test.ts > requirePinnedAsset > returns a pinned asset looked up by code and issuer 0ms
 ✓ src/pair/pinned-lookup.test.ts > requirePinnedAsset > refuses a contract ID not in the pair list 0ms
 ✓ src/pair/pinned-lookup.test.ts > requirePinnedAsset > refuses a pinned code from another issuer 0ms
 ✓ src/network/network.test.ts > parseNetworkConfig > returns the entry of the network 4ms
 ✓ src/network/network.test.ts > parseNetworkConfig > refuses a plain http endpoint at mainnet.rpcUrl 1ms
 ✓ src/network/network.test.ts > parseNetworkConfig > refuses an account where a contract belongs at mainnet.soroswapRouter 0ms
 ✓ src/reference/reference.test.ts > toReferenceReading > returns the price, its decimals and the oracle time in seconds 3ms
 ✓ src/reference/reference.test.ts > toReferenceReading > returns missing when the feed has no price 0ms
 ✓ src/reference/reference.test.ts > toReferenceReading > reports a feed with 13 decimals as invalid 1ms
 ✓ src/reference/reference.test.ts > toReferenceReading > reports a feed with 13 decimals and no price as invalid 0ms
 ✓ src/reference/reference.test.ts > toReferenceReading > reports a zero price as invalid 1ms
 ✓ src/reference/reference.test.ts > toReferenceReading > reports a negative price as invalid 0ms
 ✓ src/reference/reference.test.ts > toReferenceReading > reports a price without a timestamp as invalid 0ms
 ✓ src/reference/reference.test.ts > toReferenceReading > reports an answer that is not a price as invalid 0ms
 ✓ src/reference/reference.test.ts > baseReference > prices USD at 10^14 with no oracle time 0ms
 ✓ src/reference/reference.test.ts > referenceAgeSeconds > gives 86400 seconds for a price set a day ago 0ms
 ✓ src/reference/reference.test.ts > referenceAgeSeconds > gives 0 seconds for a price set this second 0ms
 ✓ src/reference/reference.test.ts > referenceAgeSeconds > gives 0 seconds for a price dated after now 0ms
 ✓ src/reference/reference.test.ts > referenceAgeSeconds > gives null for the base currency, which never ages 0ms
 ✓ src/pair/pair.test.ts > parsePairsConfig > returns the pairs of the network with an id and the ladder as bigint 6ms
 ✓ src/pair/pair.test.ts > parsePairsConfig > refuses a fiat the feed does not have at pairs.mainnet[0].base.fiat 2ms
 ✓ src/pair/pair.test.ts > parsePairsConfig > refuses a misspelt key at pairs.mainnet[0].base 1ms
 ✓ src/pair/pair.test.ts > parsePairsConfig > refuses the same asset on both sides at pairs.mainnet[0] 0ms
 ✓ src/pair/pair.test.ts > parsePairsConfig > refuses a ladder that does not increase at ladder 0ms
 ✓ src/pair/pair.test.ts > parsePairsConfig > refuses a ladder without 10 rungs at ladder 0ms
 ✓ src/pair/pair.test.ts > parsePairsConfig > refuses a misspelt network at pairs 0ms
 ✓ src/pair/pair.test.ts > parsePairsConfig > refuses a network with no pairs 0ms
 ✓ src/rate/rate.test.ts > refOut > 100 EURC to USDC, equal decimals 2ms
 ✓ src/rate/rate.test.ts > refOut > 100 USDC to EURC rounds down 0ms
 ✓ src/rate/rate.test.ts > refOut > output token has more decimals 0ms
 ✓ src/rate/rate.test.ts > refOut > output token has fewer decimals 0ms
 ✓ src/rate/rate.test.ts > refOut > fiat with a very small USD price (KRW) 0ms
 ✓ src/rate/rate.test.ts > refOut > largest KRW amount worth less than one … 0ms
 ✓ src/rate/rate.test.ts > refOut > smallest KRW amount worth one output un… 0ms
 ✓ src/rate/rate.test.ts > refOut > zero amount 0ms
 ✓ src/rate/rate.test.ts > refOut > negative amount truncates toward zero 0ms
 ✓ src/rate/rate.test.ts > refOut > largest amount whose product with the p… 1ms
 ✓ src/rate/rate.test.ts > refOut > product is exactly the i128 maximum 0ms
 ✓ src/rate/rate.test.ts > refOut > product is exactly the i128 minimum 0ms
 ✓ src/rate/rate.test.ts > refOut > largest power of ten that fits i128 0ms
 ✓ src/rate/rate.test.ts > refOut > refuses: zero input price 1ms
 ✓ src/rate/rate.test.ts > refOut > refuses: zero output price 0ms
 ✓ src/rate/rate.test.ts > refOut > refuses: negative input price 0ms
 ✓ src/rate/rate.test.ts > refOut > refuses: negative output price 0ms
 ✓ src/rate/rate.test.ts > refOut > refuses: invalid output price is reported before… 0ms
 ✓ src/rate/rate.test.ts > refOut > refuses: one unit above the largest amount 0ms
 ✓ src/rate/rate.test.ts > refOut > refuses: i128 maximum amount 0ms
 ✓ src/rate/rate.test.ts > refOut > refuses: product is one above the i128 maximum 0ms
 ✓ src/rate/rate.test.ts > refOut > refuses: product is one below the i128 minimum 0ms
 ✓ src/rate/rate.test.ts > refOut > refuses: input side overflows when the output to… 0ms
 ✓ src/rate/rate.test.ts > refOut > refuses: scaled numerator overflows though the r… 0ms
 ✓ src/rate/rate.test.ts > refOut > refuses: scaled denominator overflows 0ms
 ✓ src/rate/rate.test.ts > refOut > refuses: power of ten for the decimals gap overf… 0ms
 ✓ src/rate/rate.test.ts > refOut > refuses: power of ten overflows even when the am… 0ms
 ✓ src/rate/rate.test.ts > refOut > refuses negative token decimals 0ms
 ✓ src/rate/rate.test.ts > refOut > refuses fractional token decimals 0ms
 ✓ src/rate/rate.test.ts > shortfallBps > 100 EURC to USDC receiving 110.011 USDC 0ms
 ✓ src/rate/rate.test.ts > shortfallBps > exact division adds nothing 0ms
 ✓ src/rate/rate.test.ts > shortfallBps > received equals the reference 0ms
 ✓ src/rate/rate.test.ts > shortfallBps > one unit under the reference rounds up … 0ms
 ✓ src/rate/rate.test.ts > shortfallBps > one unit above the reference rounds up … 0ms
 ✓ src/rate/rate.test.ts > shortfallBps > 2 percent above the reference, exact 0ms
 ✓ src/rate/rate.test.ts > shortfallBps > above the reference, not exact, rounds … 0ms
 ✓ src/rate/rate.test.ts > shortfallBps > three times the reference 0ms
 ✓ src/rate/rate.test.ts > shortfallBps > received nothing 0ms
 ✓ src/rate/rate.test.ts > shortfallBps > received exactly the floor for a 100 bp… 0ms
 ✓ src/rate/rate.test.ts > shortfallBps > received one unit under the floor for a… 0ms
 ✓ src/rate/rate.test.ts > shortfallBps > received exactly the floor for a 1 bps … 0ms
 ✓ src/rate/rate.test.ts > shortfallBps > received one unit under the floor for a… 0ms
 ✓ src/rate/rate.test.ts > shortfallBps > received exactly the floor for a 9999 b… 0ms
 ✓ src/rate/rate.test.ts > shortfallBps > received one unit under the floor for a… 0ms
 ✓ src/rate/rate.test.ts > shortfallBps > reference of 3 units, one unit short 0ms
 ✓ src/rate/rate.test.ts > shortfallBps > refuses: zero reference, received nothing 0ms
 ✓ src/rate/rate.test.ts > shortfallBps > refuses: zero reference, received one unit 0ms
 ✓ src/rate/rate.test.ts > shortfallBps > refuses: negative reference 0ms
 ✓ src/rate/rate.test.ts > shortfallBps > refuses: difference times 10000 overflows 0ms
 ✓ src/rate/rate.test.ts > shortfallBps > refuses: difference overflows 0ms
 ✓ src/rate/rate.test.ts > floorOut > 100 EURC to USDC at 100 bps, exact 0ms
 ✓ src/rate/rate.test.ts > floorOut > 100 USDC to EURC at 100 bps rounds up 0ms
 ✓ src/rate/rate.test.ts > floorOut > 1 bps limit rounds up 0ms
 ✓ src/rate/rate.test.ts > floorOut > 9999 bps limit rounds up 0ms
 ✓ src/rate/rate.test.ts > floorOut > limit of 0 bps is the reference 0ms
 ✓ src/rate/rate.test.ts > floorOut > limit of 10000 bps is zero 0ms
 ✓ src/rate/rate.test.ts > floorOut > reference of 3 units at 100 bps is the … 0ms
 ✓ src/rate/rate.test.ts > floorOut > reference of 1 unit at 9999 bps rounds … 0ms
 ✓ src/rate/rate.test.ts > floorOut > zero reference 0ms
 ✓ src/rate/rate.test.ts > floorOut > refuses: limit above 10000 bps 0ms
 ✓ src/rate/rate.test.ts > floorOut > refuses: reference times the multiplier overflows 0ms
 ✓ src/rate/rate.test.ts > floorOut > refuses a negative limit 0ms
 ✓ src/rate/rate.test.ts > mainnet snapshot of 2026-11-09 > 100,000 USDC to EURC on sdex, measured … 0ms
 ✓ src/rate/rate.test.ts > mainnet snapshot of 2026-11-09 > 100,000 USDC to EURC on soroswap, measu… 0ms
 ✓ src/rate/rate.test.ts > mainnet snapshot of 2026-11-09 > 100,000 USDC to EURC on aquarius, measu… 0ms
 ✓ src/rate/rate.test.ts > mainnet snapshot of 2026-11-09 > 100,000 EURC to USDC on sdex, measured … 0ms
 ✓ src/rate/rate.test.ts > mainnet snapshot of 2026-11-09 > 100,000 EURC to USDC on soroswap, measu… 0ms
 ✓ src/rate/rate.test.ts > mainnet snapshot of 2026-11-09 > 100,000 EURC to USDC on aquarius, measu… 0ms
 ✓ src/pair/swap-assets.test.ts > swapAssets > spends and receives the right token for base_to_quote 2ms
 ✓ src/pair/swap-assets.test.ts > swapAssets > spends and receives the right token for quote_to_base 0ms
 ✓ src/node/reference-reader.test.ts > readReference > returns the price the feed holds for the currency 2ms
 ✓ src/node/reference-reader.test.ts > readReference > returns missing when the feed has no price for the currency 0ms
 ✓ src/node/reference-reader.test.ts > readReference > returns unavailable with the reason and its cause when the decimals call fails 0ms
 ✓ src/node/reference-reader.test.ts > readReference > returns unavailable with the reason and its cause when the lastprice call fails 0ms
 ✓ src/node/reference-reader.test.ts > readReference > prices USD without calling the feed 1ms
 ✓ src/node/config.test.ts > config files in the repo > use the public network passphrase on mainnet 1ms
 ✓ src/node/config.test.ts > config files in the repo > pin USDC to the SAC of its code and issuer 0ms
 ✓ src/node/config.test.ts > config files in the repo > pin EURC to the SAC of its code and issuer 0ms
 ✓ src/node/config.test.ts > config files in the repo > hold addresses with a valid checksum 0ms
 ✓ src/node/config.test.ts > loadConfig > refuses a folder without config files and names the file 1ms
 ✓ src/node/config.test.ts > loadConfig > refuses a contract that is the SAC of another a… 2ms
 ✓ src/node/config.test.ts > loadConfig > refuses mainnet contracts next to the testnet p… 1ms
 ✓ src/node/config.test.ts > loadConfig > refuses an issuer whose last character was mist… 1ms
 ↓ src/node/reference-reader.smoke.test.ts > the live Reflector fiat feed > holds a plausible EUR price on mainnet, at the addresses in config/
 ↓ src/node/reference-reader.smoke.test.ts > the live Reflector fiat feed > holds a plausible EUR price on testnet

 Test Files  11 passed | 1 skipped (12)
      Tests  136 passed | 2 skipped (138)
   Start at  23:40:00
   Duration  639ms (import 72%, transform 22%, worker 3%, tests 3%)
```

## venues: 78 passed, 3 skipped

```sh
pnpm --filter @fair-fx/venues test --reporter=verbose
```

```text
$ vitest run --reporter=verbose

 RUN  v5.1.1 /path/to/fair-fx/packages/venues

 ✓ src/guard-mode.test.ts > GUARD_MODE > has a mode for every venue 1ms
 ✓ src/guard-mode.test.ts > GUARD_MODE > never claims the contract can wrap SDEX 0ms
 ✓ src/soroswap/soroswap.test.ts > toSoroswapQuote > returns an error for one amount 2ms
 ✓ src/soroswap/soroswap.test.ts > toSoroswapQuote > returns an error for three amounts, a path through another t… 0ms
 ✓ src/soroswap/soroswap.test.ts > toSoroswapQuote > returns an error for amounts as text 0ms
 ✓ src/soroswap/soroswap.test.ts > toSoroswapQuote > returns an error for an amount out below zero 0ms
 ✓ src/soroswap/soroswap.test.ts > toSoroswapQuote > returns an error for no value 0ms
 ✓ src/adapters.test.ts > every venue adapter > names itself sdex and is guarded in mode B 1ms
 ✓ src/adapters.test.ts > every venue adapter > names itself soroswap and is guarded in mode A 0ms
 ✓ src/adapters.test.ts > every venue adapter > names itself aquarius and is guarded in mode A 0ms
 ↓ src/aquarius/aquarius.smoke.test.ts > the live Aquarius API > quotes 100 USDC to EURC on mainnet, at the addresses in config/
 ✓ src/aquarius/aquarius.test.ts > toAquariusQuote > keeps the swap chain, the pools and the token contracts as the route 18ms
 ✓ src/aquarius/aquarius.test.ts > toAquariusQuote > reads an amount with a decimal fraction, cut off and not rou… 0ms
 ✓ src/aquarius/aquarius.test.ts > toAquariusQuote > reads an amount with more digits than a JSON number holds 0ms
 ✓ src/aquarius/aquarius.test.ts > toAquariusQuote > returns no_route and says why for a path that pays nothing 0ms
 ✓ src/aquarius/aquarius.test.ts > toAquariusQuote > returns no_route and says why for no path, whatever the other fields hold 0ms
 ✓ src/aquarius/aquarius.test.ts > toAquariusQuote > returns an error that names the field for a JSON number too large to be exact 1ms
 ✓ src/aquarius/aquarius.test.ts > toAquariusQuote > returns an error that names the field for an amount below zero 0ms
 ✓ src/aquarius/aquarius.test.ts > toAquariusQuote > returns an error that names the field for an amount below zero as a JSON integer 0ms
 ✓ src/aquarius/aquarius.test.ts > toAquariusQuote > returns an error that names the field for an amount that is not a number 0ms
 ✓ src/aquarius/aquarius.test.ts > toAquariusQuote > returns an error that names the field for an empty swap chain 0ms
 ✓ src/aquarius/aquarius.test.ts > toAquariusQuote > returns an error that names the field for a body that does not say whether a path… 0ms
 ✓ src/aquarius/aquarius.test.ts > toAquariusQuote > returns an error for a body that is not JSON 0ms
 ✓ src/aquarius/aquarius.test.ts > toAquariusQuote > returns an error for an HTTP error with one reason as text, as Aquarius answers… 0ms
 ✓ src/aquarius/aquarius.test.ts > toAquariusQuote > returns an error for an HTTP error with no reason at all 0ms
 ✓ src/aquarius/aquarius.test.ts > toAquariusQuote > returns an error for an HTTP error with a token it does not list and one more r… 0ms
 ✓ src/sdex/sdex.test.ts > strictSendUrl > asks what an amount of the input token pays in the output token 2ms
 ✓ src/sdex/sdex.test.ts > strictSendUrl > names an input code longer than 4 characters as credit_alphanum12 0ms
 ✓ src/sdex/sdex.test.ts > strictSendUrl > keeps the path of a Horizon that is not at the root of its host 0ms
 ✓ src/sdex/sdex.test.ts > toSdexQuote > returns the amount in stroops, the path and the ledger of the answer 2ms
 ✓ src/sdex/sdex.test.ts > toSdexQuote > returns the path that pays the most when it is not listed first 1ms
 ✓ src/sdex/sdex.test.ts > toSdexQuote > returns no ledger when Horizon does not send the Latest-Ledger header 0ms
 ✓ src/sdex/sdex.test.ts > toSdexQuote > returns no_route and says why when Horizon lists no path 0ms
 ✓ src/sdex/sdex.test.ts > toSdexQuote > returns no_route and says why when the only path pays nothing 0ms
 ✓ src/sdex/sdex.test.ts > toSdexQuote > reports an amount that is not a decimal number as an error and says which kind 1ms
 ✓ src/sdex/sdex.test.ts > toSdexQuote > reports a body without records as an error and says which kind 1ms
 ✓ src/sdex/sdex.test.ts > toSdexQuote > reports a body that is not JSON as an error and says which kind 0ms
 ✓ src/sdex/sdex.test.ts > toSdexQuote > reports an HTTP error that names its cause as an error and says which kind 2ms
 ✓ src/sdex/sdex.test.ts > toSdexQuote > reports an HTTP error with no Horizon body as an error and says which kind 0ms
 ✓ src/sdex/sdex-adapter.test.ts > sdexAdapter > quotes 100 USDC to EURC from a recorded answer 20ms
 ✓ src/sdex/sdex-adapter.test.ts > sdexAdapter > quotes 100,000 EURC to USDC from a recorded answer 4ms
 ✓ src/sdex/sdex-adapter.test.ts > sdexAdapter > takes the better of two recorded paths, the one through XLM 2ms
 ✓ src/sdex/sdex-adapter.test.ts > sdexAdapter > asks Horizon to send USDC for base_to_quote 1ms
 ✓ src/sdex/sdex-adapter.test.ts > sdexAdapter > asks Horizon to send EURC for quote_to_base 1ms
 ✓ src/sdex/sdex-adapter.test.ts > sdexAdapter > returns no_route from a recorded answer with no path 1ms
 ✓ src/sdex/sdex-adapter.test.ts > sdexAdapter > returns an error with the reason Horizon gave for a recorded 400 1ms
 ✓ src/sdex/sdex-adapter.test.ts > sdexAdapter > returns an error, and does not throw, when Horizon takes longer than the timeout 2ms
 ✓ src/sdex/sdex-adapter.test.ts > sdexAdapter > returns an error with the cause when the request fails 0ms
 ✓ src/sdex/sdex-adapter.test.ts > sdexAdapter > returns an error of an unknown kind when fetch rejects with something that is not a TypeError 1ms
 ✓ src/sdex/sdex-adapter.test.ts > sdexAdapter > returns an error for an HTML error page 0ms
 ✓ src/sdex/sdex-adapter.test.ts > sdexAdapter > refuses an amount of zero without calling Horizon 0ms
 ✓ src/soroswap/soroswap-adapter.test.ts > soroswapAdapter > quotes 100 USDC to EURC from a recorded answer 31ms
 ✓ src/soroswap/soroswap-adapter.test.ts > soroswapAdapter > quotes 100,000 EURC to USDC from a recorded answer 3ms
 ✓ src/soroswap/soroswap-adapter.test.ts > soroswapAdapter > asks the router what 100 USDC pays for base_to_quote 6ms
 ✓ src/soroswap/soroswap-adapter.test.ts > soroswapAdapter > asks the router what 100 EURC pays for quote_to_base 2ms
 ✓ src/soroswap/soroswap-adapter.test.ts > soroswapAdapter > returns no_route from a recorded answer that pays nothing for 1 stroop 2ms
 ✓ src/soroswap/soroswap-adapter.test.ts > soroswapAdapter > returns no_route for a pair nobody created, once the router has answered another call 3ms
 ✓ src/soroswap/soroswap-adapter.test.ts > soroswapAdapter > returns no_route when the router says the pool is empty 1ms
 ✓ src/aquarius/aquarius-adapter.test.ts > aquariusAdapter > quotes 100 USDC to EURC from a recorded answer, a path of two pools through sUSD 26ms
 ✓ src/aquarius/aquarius-adapter.test.ts > aquariusAdapter > quotes 100,000 EURC to USDC from a recorded answer 1ms
 ✓ src/aquarius/aquarius-adapter.test.ts > aquariusAdapter > quotes the estimate, not the lower bound, from a recorded answer to a request with slippage 1ms
 ✓ src/aquarius/aquarius-adapter.test.ts > aquariusAdapter > quotes from a recorded answer of the endpoint asked before, which sends amounts as decimal strings 1ms
 ✓ src/aquarius/aquarius-adapter.test.ts > aquariusAdapter > posts the two contracts and the amount of USDC for base_to_quote 1ms
 ✓ src/aquarius/aquarius-adapter.test.ts > aquariusAdapter > posts the two contracts and the amount of EURC for quote_to_base 0ms
 ✓ src/aquarius/aquarius-adapter.test.ts > aquariusAdapter > returns no_route as no path from a recorded answer for 1 stroop, which Aquarius does not tell from a missing pool 1ms
 ✓ src/aquarius/aquarius-adapter.test.ts > aquariusAdapter > returns no_route from a recorded 400 that says Aquarius lists no such token 1ms
 ✓ src/aquarius/aquarius-adapter.test.ts > aquariusAdapter > returns an error with what Aquarius said in a recorded 400 for a request that names one token 2ms
 ✓ src/aquarius/aquarius-adapter.test.ts > aquariusAdapter > returns an error, and does not throw, when Aquarius takes longer than the timeout 2ms
 ✓ src/aquarius/aquarius-adapter.test.ts > aquariusAdapter > returns an error for an HTML error page 1ms
 ✓ src/soroswap/soroswap-adapter.errors.test.ts > soroswapAdapter, when the quote cannot be read > returns an error when no contract is deployed at the router address 34ms
 ✓ src/soroswap/soroswap-adapter.errors.test.ts > soroswapAdapter, when the quote cannot be read > returns an error that blames the RPC node, not the router, when the second read cannot be made 4ms
 ✓ src/soroswap/soroswap-adapter.errors.test.ts > soroswapAdapter, when the quote cannot be read > returns an error from a recorded answer to an amount too large for the pool arithmetic 3ms
 ✓ src/soroswap/soroswap-adapter.errors.test.ts > soroswapAdapter, when the quote cannot be read > returns an error, and does not throw, when the RPC node takes longer than the timeout 2ms
 ✓ src/soroswap/soroswap-adapter.errors.test.ts > soroswapAdapter, when the quote cannot be read > returns an error with the message of a JSON-RPC error 1ms
 ✓ src/soroswap/soroswap-adapter.errors.test.ts > soroswapAdapter, when the quote cannot be read > returns an error for an HTML error page 1ms
 ✓ src/soroswap/soroswap-adapter.errors.test.ts > soroswapAdapter, when the quote cannot be read > returns an error as rejected when the RPC node answers 401, as a node that wants a key does 1ms
 ✓ src/soroswap/soroswap-adapter.errors.test.ts > soroswapAdapter, when the quote cannot be read > returns an error as a network failure, without the detail the SDK drops, when the RPC node cannot be reached 1ms
 ✓ src/soroswap/soroswap-adapter.errors.test.ts > soroswapAdapter, when the quote cannot be read > returns an error of an unknown kind for a 200 that is not JSON-RPC, which the SDK fails to read 1ms
 ✓ src/soroswap/soroswap-adapter.errors.test.ts > soroswapAdapter, when the quote cannot be read > refuses an amount of zero without calling the RPC node 1ms
 ↓ src/sdex/sdex.smoke.test.ts > the live Horizon > quotes 100 USDC to EURC on mainnet, at the addresses in config/
 ↓ src/soroswap/soroswap.smoke.test.ts > the live Soroswap router > quotes 100 USDC to EURC on mainnet, at the addresses in config/

 Test Files  9 passed | 3 skipped (12)
      Tests  78 passed | 3 skipped (81)
   Start at  23:40:01
   Duration  1.11s (import 84%, transform 12%, tests 3%, worker 1%)
```

## db: 18 passed

```sh
pnpm --filter @fair-fx/db test --reporter=verbose
```

```text
$ vitest run --reporter=verbose

 RUN  v5.1.1 /path/to/fair-fx/packages/db

 ✓ src/migrate/migrate.test.ts > migrate > creates the tables of a run and its samples in an empty database 149ms
 ✓ src/migrate/migrate.test.ts > migrate > applies nothing to a database that has every migration 55ms
 ✓ src/writes/write-run-values.test.ts > writeRun, values at the edge of what Postgres stores > keeps every digit of an amount and a price too large for a JavaScript number 117ms
 ✓ src/writes/write-run-values.test.ts > writeRun, values at the edge of what Postgres stores > replaces the characters Postgres cannot store in the text a venue sent 73ms
 ✓ src/writes/write-run-slot.test.ts > writeRun, one run per slot > stores nothing and says the slot is taken when a run of the slot is stored already 121ms
 ✓ src/writes/write-run-slot.test.ts > writeRun, one run per slot > waits for a run that is writing the same slot, then says the slot is taken 79ms
 ✓ src/writes/write-run.test.ts > writeRun > stores a run with its reference and a quote of each status 116ms
 ✓ src/writes/write-run.test.ts > writeRun > stores a reference read that gave no price, with why: { status: 'missing', fiat: 'EUR' } 74ms
 ✓ src/writes/write-run-slot.test.ts > writeRun, one run per slot > stores nothing of a run when the database refuses one of its rows 65ms
 ✓ src/writes/write-run-values.test.ts > writeRun, values at the edge of what Postgres stores > stores a bigint inside a route as a decimal string 67ms
 ✓ src/writes/write-run-values.test.ts > writeRun, values at the edge of what Postgres stores > stores a quote in every direction core names: base_to_quote 49ms
 ✓ src/writes/write-run.test.ts > writeRun > stores a reference read that gave no price, with why: { status: 'invalid', fiat: 'EUR', …(1) } 61ms
 ✓ src/writes/write-run.test.ts > writeRun > stores a reference read that gave no price, with why: { status: 'unavailable', …(2) } 50ms
 ✓ src/writes/write-run.test.ts > writeRun > stores a run that has no ledger, and a priced quote that has no shortfall or ledger 43ms
 ✓ src/writes/write-run-values.test.ts > writeRun, values at the edge of what Postgres stores > stores a quote in every direction core names: quote_to_base 44ms
 ✓ src/writes/write-run-values.test.ts > writeRun, values at the edge of what Postgres stores > stores a run in every reference state core names: fresh 51ms
 ✓ src/writes/write-run-values.test.ts > writeRun, values at the edge of what Postgres stores > stores a run in every reference state core names: closed 40ms
 ✓ src/writes/write-run-values.test.ts > writeRun, values at the edge of what Postgres stores > stores a run in every reference state core names: unknown 45ms

 Test Files  4 passed (4)
      Tests  18 passed (18)
   Start at  23:40:03
   Duration  2.98s (tests 80%, import 14%, transform 5%, worker 1%)
```

## Live tests: 5 passed

```sh
pnpm test:smoke --reporter=verbose
```

```text
$ FAIRFX_SMOKE=1 pnpm --filter @fair-fx/core --filter @fair-fx/venues run test smoke --reporter=verbose
Scope: 2 of 4 workspace projects
$ vitest run smoke --reporter=verbose

 RUN  v5.1.1 /path/to/fair-fx/packages/core

 ✓ src/node/reference-reader.smoke.test.ts > the live Reflector fiat feed > holds a plausible EUR price on mainnet, at the addresses in config/ 583ms
 ✓ src/node/reference-reader.smoke.test.ts > the live Reflector fiat feed > holds a plausible EUR price on testnet 1022ms

 Test Files  1 passed (1)
      Tests  2 passed (2)
   Start at  23:39:09
   Duration  1.91s (tests 88%, import 11%, transform 1%)

$ vitest run smoke --reporter=verbose

 RUN  v5.1.1 /path/to/fair-fx/packages/venues

 ✓ src/soroswap/soroswap.smoke.test.ts > the live Soroswap router > quotes 100 USDC to EURC on mainnet, at the addresses in config/ 471ms
 ✓ src/aquarius/aquarius.smoke.test.ts > the live Aquarius API > quotes 100 USDC to EURC on mainnet, at the addresses in config/ 997ms
 ✓ src/sdex/sdex.smoke.test.ts > the live Horizon > quotes 100 USDC to EURC on mainnet, at the addresses in config/ 1353ms

 Test Files  3 passed (3)
      Tests  3 passed (3)
   Start at  23:39:11
   Duration  1.74s (tests 75%, import 21%, transform 3%)
```
