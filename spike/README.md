# Spike: `guarded_swap` above a real router

Throwaway code. It answers two questions before any `fx_guard` code is written:

1. Does a user's signature over `guarded_swap` also cover the router call and the token transfer
   below it, for the real Soroswap and Aquarius routers?
2. What does such a swap cost in CPU, memory, ledger entries and fee?

This branch is not meant to be merged.

## What counts as an answer

| Question | Counts | Does not count |
| --- | --- | --- |
| The signature covers the nested calls | A signed transaction the network applied, with its hash | A unit test, where every authorization is mocked |
| A refused swap moves nothing | A second transaction that fails, and the balances after it | A simulation alone |
| Cost | Numbers from the simulation and from the applied transaction | An estimate by hand |

## Status

| Step | State |
| --- | --- |
| Toolchain pinned (`soroban-sdk` 30.0.0, Rust 1.99.1), contract builds to wasm | Done |
| Unit tests with a test venue (mocked authorization) | Done, 5 tests |
| Soroswap on testnet, signed: one swap applied, one refused | Done, 2 transactions (below) |
| Aquarius on testnet, signed: one swap applied, one refused | Done, 2 transactions (below) |
| Cost of the guard above each router | Done on testnet, simulated (below) |
| The guard above the mainnet Soroswap router code, on a snapshot | Done, 4 tests, mocked authorization |
| The guard above the mainnet Aquarius router code, on a snapshot | Done, 3 tests, mocked authorization |
| Path payment with `destMin` on testnet: one applied, one refused | Done, 2 transactions (below) |
| Reflector price read from a contract on testnet | Done, 1 transaction and 5 unit tests (below) |
| A venue that calls the guard back | Done, 1 unit test: the host stops it |

Question 1 is answered on testnet for both routers, with one pool and one hop each. Nothing here
ran on mainnet. The mainnet code of both routers ran on snapshots of mainnet state, where
authorization is mocked. The two testnet routers are not the same builds as the mainnet ones:
Soroswap wasm `4b95…` against `4c3d…`, Aquarius wasm `840a…` against `2f8e…`.

## Soroswap on testnet

Run on 2026-11-27 with `scripts/testnet_guarded_swap.sh soroswap`. The assets are two classic test
assets with trustlines, TUSD and TEUR, wrapped as token contracts the way USDC and EURC are. The
pool was made through the Soroswap testnet router `CCJUD55A…7BRD`. Addresses are in
`testnet/deployed.env`, the files behind every number below in `testnet/evidence/`. Testnet is
reset from time to time, and the explorer links stop working then.

The user's key signs one transaction. In both runs the router is given `amount_out_min = 0`, so the
only floor is the guard's `min_out`. Amounts are in units of 0.0000001.

| | Swap applied | Swap refused |
| --- | --- | --- |
| Transaction | [`51ee52ed…e735f0`](https://stellar.expert/explorer/testnet/tx/51ee52ed4ff400c6fc53f4b915756abcc0a4473c8f58884afe5908fe82e735f0) | [`4045a0ad…72595d`](https://stellar.expert/explorer/testnet/tx/4045a0adb43c17a873d37ba163a64c97d5176133fe6c2614529585549672595d) |
| Ledger, close time (UTC) | 5951197, 11:40:29 | 5951206, 11:41:14 |
| Network result | `SUCCESS` | `FAILED`, contract error 8 (`BelowFloor`) raised by the guard |
| `amount_in` | 1,000,000,000 TUSD | 1,000,000,000 TUSD |
| Guard `min_out` | 916,326,422 | 914,500,165 |
| Paid by the router | 916,326,422 | 896,534,060, then undone |
| User TUSD, before and after | 100,000,000,000 and 99,000,000,000 | 99,000,000,000 and 99,000,000,000 |
| User TEUR, before and after | 100,000,000,000 and 100,916,326,422 | 100,916,326,422 and 100,916,326,422 |
| Fee charged, in XLM | 0.0018756 | 0.0015347 |

How the second one was refused: it was simulated and signed while the pool quoted 914,500,165.
Then a second account sold 10,000,000,000 TUSD into the pool, and only after that the signed
transaction was sent. The network applied it, the router swapped at the new price, the guard saw
less than `min_out` arrive and returned error 8, and every transfer was undone. The user lost the
fee and nothing else. The guard held no token before or after either run.

What the user signed, read from `testnet/evidence/soroswap-pass/simulated.json`. It is one
authorization with source account credentials:

```
guard     guarded_swap
  router    swap_exact_tokens_for_tokens
    TUSD      transfer (user to pair, amount_in)
```

Two things this run found:

- The Soroswap router takes the input from its `to` argument and pays the output to the same
  address. Through Soroswap the guard's `recipient` has to be the `user`.
- A refused swap still costs the user the fee, here 0.0015347 XLM.

### Cost

`scripts/testnet_costs.sh soroswap 1000000000` simulates the same swap twice on the same pool
state: straight to the router, and through the guard.

| | Direct | Through the guard | Added |
| --- | --- | --- | --- |
| Instructions | 2,513,499 | 3,095,467 | 581,968 (23%) |
| Ledger entries read only | 5 | 7 | 2 (the guard and its code) |
| Ledger entries written | 5 | 5 | 0 |
| Disk read bytes | 232 | 232 | 0 |
| Write bytes | 1,188 | 1,188 | 0 |
| Transaction size, bytes | 1,473 | 2,385 | 912 |
| Resource fee, stroops | 21,755 | 24,006 | 2,251 (10%) |

These are testnet numbers for a pool of two test assets and one hop. The testnet router is not the
same build as the mainnet one (wasm `4b95…` against `4c3d…`), and fees follow each network's own
settings.

## Aquarius on testnet

Run on 2026-11-27 with `scripts/testnet_guarded_swap.sh aquarius`, against the Aquarius testnet
router `CBCFTQSP…A6GD` and one of its own pools: Aquarius' test AQUA to its test USDC, two classic
assets, constant product, fee 0.3%. The guard is the same deployed contract as above, unchanged.
The router function is `swap_chained` with a chain of one hop and `out_min = 0`.

| | Swap applied | Swap refused |
| --- | --- | --- |
| Transaction | [`d0a1dece…e4ab511`](https://stellar.expert/explorer/testnet/tx/d0a1decea150ba8668e75c812da9765a743665bcfe93bed757c8922c1e4ab511) | [`c6dd0050…eff076c`](https://stellar.expert/explorer/testnet/tx/c6dd0050ffcdca6e3457e9c51b366d1f876859798184b11e93786402ceff076c) |
| Ledger, close time (UTC) | 5951309, 11:49:49 | 5951318, 11:50:34 |
| Network result | `SUCCESS` | `FAILED`, contract error 8 (`BelowFloor`) raised by the guard |
| `amount_in` | 10,000,000,000 AQUA | 10,000,000,000 AQUA |
| Guard `min_out` | 54,901,754 | 50,578,183 |
| Paid by the router | 54,901,754 | 43,333,630, then undone |
| User AQUA, before and after | 40,825,492,245 and 30,825,492,245 | 30,825,492,245 and 30,825,492,245 |
| User USDC, before and after | 0 and 54,901,754 | 54,901,754 and 54,901,754 |
| Fee charged, in XLM | 0.0032513 | 0.0021686 |

The second one was refused the same way as on Soroswap: signed at a quote of 50,578,183, then a
second account sold 20,000,000,000 AQUA into the pool, then the signed transaction was sent.

What the user signed, from `testnet/evidence/aquarius-pass/simulated.json`, again one authorization
with source account credentials:

```
guard     guarded_swap
  router    swap_chained
    AQUA      transfer (user to router, amount_in)
```

The shape is the same as on Soroswap. The one difference is where the input goes: Aquarius pulls
it into the router, Soroswap sends it to the pair. Aquarius also pays the output to the address
that paid the input, so here too `recipient` has to be the `user`.

### Cost

`scripts/testnet_costs.sh aquarius 10000000000`:

| | Direct | Through the guard | Added |
| --- | --- | --- | --- |
| Instructions | 6,338,230 | 6,900,608 | 562,378 (9%) |
| Ledger entries read only | 7 | 9 | 2 (the guard and its code) |
| Ledger entries written | 7 | 7 | 0 |
| Disk read bytes | 232 | 232 | 0 |
| Write bytes | 3,644 | 3,644 | 0 |
| Transaction size, bytes | 2,112 | 3,141 | 1,029 |
| Resource fee, stroops | 28,924 | 31,512 | 2,588 (9%) |

## Path payment on testnet

The route without a contract: a classic `path_payment_strict_send` of TUSD for TEUR against a sell
offer on the order book (10,000 TEUR at 1.087 TUSD each), with the operation's own `destMin` as
the floor. Run with `scripts/testnet_path_payment.sh`.

| | Payment applied | Payment refused |
| --- | --- | --- |
| Transaction | [`51e77385…7145311`](https://stellar.expert/explorer/testnet/tx/51e773850ace2a585053eea733c3bc514eb86b0d98fe985e0e4afeab07145311) | [`503eac1c…fdd92f1`](https://stellar.expert/explorer/testnet/tx/503eac1c4fa8cfc24f9429fe772a9d43a1258f1b0d3e0a273e1e8ae40fdd92f1) |
| Ledger, close time (UTC) | 5951408, 11:58:04 | 5951410, 11:58:14 |
| Network result | `SUCCESS` | `FAILED`, operation result `under_destmin` |
| Sent | 1,000,000,000 TUSD | 1,000,000,000 TUSD |
| `destMin` | 919,963,201 | 919,963,202 |
| User TEUR, before and after | 100,916,326,422 and 101,836,289,623 | 101,836,289,623 and 101,836,289,623 |
| Fee charged, in XLM | 0.00001 | 0.00001 |

The offer pays 919,963,201 for that amount. One unit more in `destMin` and the network refuses the
payment with a named result and moves nothing.

## Reflector price read from a contract

`oracle-read/` is a second small contract, kept apart so the deployed guard does not change. Its
`fiat_price(oracle, symbol, max_age_seconds)` calls `lastprice(Asset::Other(symbol))` on a
Reflector feed and refuses a missing price (error 4), an old one (error 5), and one that is not
positive or is dated after the ledger (error 6). Five unit tests cover those, each seen failing
against a seeded fault. Run on testnet with `scripts/testnet_oracle_read.sh`, against the Reflector
fiat feed `CCSSOHTB…5NV4W` (USD base, 14 decimals):

- Sent as transaction
  [`b382929e…6ba72c`](https://stellar.expert/explorer/testnet/tx/b382929e937ca90d047f717404fb64b5270198768346b79ced4a40b60b6ba72c),
  ledger 5951439: EUR at 109,657,386,069,270, which is 1.09657386 USD, dated 39 seconds before
  the ledger, with a limit of 600 seconds.
- Simulated with a limit of 1 second: error 5. Simulated for a symbol the feed does not have:
  error 4. A read that fails in simulation is never sent, so these two are simulations.

This is the testnet feed. The mainnet feed has not been read from a contract.

## A venue that calls the guard back

One unit test gives the guard a venue that calls `guarded_swap` again while the first call is
still waiting. The host stops it with "Contract re-entry is not allowed". It is a unit test, and
the host code is the same one the network runs (`soroban-env-host` 30.0.1).

## What the testnet runs do not show

- A mainnet router with a real signature. The snapshot tests below run the mainnet code of both
  routers with mocked authorization and get the same tree as on testnet.
- Real USDC and EURC on a network, or mainnet fees. On testnet each router ran one pool and one
  hop. The mainnet Aquarius snapshot test runs three hops, through one constant product and two
  concentrated pools.
- An account that signs through a contract (a smart wallet). Both users here are classic accounts
  that are also the source of the transaction.

## Run

Needs Rust (the version in `rust-toolchain.toml` at the repo root) and `stellar-cli` 30.

```sh
cd spike
cargo test                 # 17 tests, offline
stellar contract build     # target/wasm32v1-none/release/spike_guard.wasm and spike_oracle_read.wasm
```

The testnet runs need the network and write keys to the keystore of `stellar-cli`, never to this
repo:

```sh
scripts/testnet_setup.sh             # once: accounts, test assets, Soroswap pool, guard
scripts/testnet_setup_aquarius.sh    # once: trustlines and test AQUA for the Aquarius runs
scripts/testnet_guarded_swap.sh <soroswap|aquarius> <label> <amount_in> <min_out> [<mover_amount>]
scripts/testnet_costs.sh <soroswap|aquarius> <amount_in>
scripts/testnet_path_payment.sh <label> <send_amount> <dest_min>
scripts/testnet_oracle_read.sh
```

## Mainnet state

`snapshots/soroswap-usdc-eurc.json` is mainnet at ledger 65698431 (2026-11-27 11:17 UTC): the
Soroswap router, its factory, the USDC/EURC pair with its two token balances, and the USDC and EURC
token contracts. One test runs the mainnet router on it and gets 91.7403921 EURC for 100 USDC, the
amount the FairFX collector stored from the live network at 09:55 UTC that day. Three more put the
guard above that router: a swap at the quoted amount goes through, a swap with a floor one unit
higher is undone, and the user's authorization is one tree from the guard down to the USDC
transfer.

It was made in four steps. The first downloads the mainnet bucket list, 14 GB on disk, into the
cache folder of `stellar-cli`.

```sh
STELLAR_RPC_URL=https://mainnet.sorobanrpc.com \
STELLAR_NETWORK_PASSPHRASE='Public Global Stellar Network ; September 2015' \
stellar snapshot create \
  --address CAG5LRYQ5JVEUI5TEID72EYOVX44TTUJT5BQR2J6J77FH65PCCFAJDDH \
  --address CA4HEQTL2WPEUYKYKCDOHCDNIV4QHNJ7EL4J4NQ6VADP7SYHVRYZ7AW2 \
  --address CC7CDFY2VGDODJ7WPO3JIK2MXLOAXL4LRQCC43UJDBAIJ4SVFO3HNPOC \
  --address CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75 \
  --address CDTKPWPLOURQA2SGTKTUQOWRCBZEORB4BWBOMJ3D3ZTQQSGE5F6JBQLV \
  --out /tmp/full.json

python3 scripts/add_contract_code.py /tmp/full.json https://mainnet.sorobanrpc.com

python3 scripts/trim_token_balances.py /tmp/full.json snapshots/soroswap-usdc-eurc.json \
  --token CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75 \
  --token CDTKPWPLOURQA2SGTKTUQOWRCBZEORB4BWBOMJ3D3ZTQQSGE5F6JBQLV \
  --holder CC7CDFY2VGDODJ7WPO3JIK2MXLOAXL4LRQCC43UJDBAIJ4SVFO3HNPOC

python3 scripts/add_accounts.py snapshots/soroswap-usdc-eurc.json https://mainnet.sorobanrpc.com \
  GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN \
  GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2
```

Three things to know about the file:

- `stellar snapshot create` of stellar-cli 30.0.1 writes contract data only. It leaves out the wasm
  of the contracts and the issuer accounts, so the second step reads the three wasm entries from
  the RPC. The expiry ledgers of the contract data entries are still missing.
- The third step drops 53,221 balances and allowances of other holders, which takes the file from
  73 MB to 0.3 MB.
- The fourth step adds the issuer accounts of USDC and EURC, which a token contract reads when it
  opens a balance for a new holder. They come from the RPC at a later ledger than the snapshot
  (last changed at ledgers 65578556 and 65659173, both before it).

A test on this file runs real mainnet code on real mainnet state, with mocked authorization. It can
show what a router does and what it costs. It cannot show that a signature is accepted.

### Aquarius

`snapshots/aquarius-usdc-eurc.json` is mainnet at ledger 65698970 (2026-11-27 12:02 UTC). It was
made another way, without the 14 GB download: simulate the swap on mainnet through the RPC, take
the list of ledger entries the simulation touched, and read exactly those entries in one RPC
call. Nothing was signed or sent. The simulation needs an address that holds USDC, and used the
Soroswap USDC/EURC pair contract for that. The simulated transaction is kept in
`mainnet/aquarius-direct-simulated.json`.

```sh
python3 scripts/snapshot_from_footprint.py mainnet/aquarius-direct-simulated.json \
  snapshots/soroswap-usdc-eurc.json https://mainnet.sorobanrpc.com snapshots/aquarius-usdc-eurc.json
python3 scripts/add_accounts.py snapshots/aquarius-usdc-eurc.json https://mainnet.sorobanrpc.com \
  GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN \
  GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2
```

The route is the one the Aquarius API returned for 100 USDC to EURC at that time: USDC to CETES to
sUSD to EURC, through one constant product pool and two concentrated pools. Three tests put the
guard above the mainnet router `CBQDHNBF…C6QUK` on it. The swap pays 91.9094020 EURC, the amount
the API quoted. A floor one unit higher undoes it. The authorization is one tree: guard,
`swap_chained`, USDC transfer.

A snapshot made this way holds what one call needs and no more. Another route or another amount
may touch entries it does not have.

### Cost on mainnet

The simulation above is of the direct swap, without the guard, on mainnet at 12:02 UTC:
37,574,361 instructions, 35 ledger entries (17 read only, 18 written), 11,964 bytes written and a
resource fee of 172,580 stroops (0.017258 XLM). The limit of one transaction on mainnet, read
from the network's settings the same day, is 400,000,000 instructions and 200 entries. The guard
is not deployed on mainnet, so its cost there is not measured: on testnet it added about 570,000
instructions to either router.

