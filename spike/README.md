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
| Unit tests with a test venue (mocked authorization) | Done, 4 tests |
| Mainnet state loaded from a ledger snapshot, real router code runs on it | Done, 1 test |
| Soroswap on testnet, signed: one swap applied, one refused | Done, 2 transactions (below) |
| The guard above the mainnet Soroswap router, on the snapshot | Done, 3 tests, mocked authorization |
| Cost of the guard above Soroswap | Done on testnet, simulated (below) |
| Aquarius, signed | Not started |
| Path payment with `destMin`, oracle read from a contract | Not started |

Question 1 is answered for Soroswap and open for Aquarius. Nothing here ran on mainnet: the
mainnet router code ran on a snapshot only.

## Soroswap on testnet

Run on 2026-11-27 with `scripts/testnet_guarded_swap.sh`. The assets are two classic test assets
with trustlines, TUSD and TEUR, wrapped as token contracts the way USDC and EURC are. The pool was
made through the Soroswap testnet router. Addresses are in `testnet/deployed.env`, the files behind
every number below in `testnet/evidence/`. Testnet is reset from time to time, and the explorer
links stop working then.

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

`scripts/testnet_costs.sh` simulates the same swap twice on the same pool state: straight to the
router, and through the guard.

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

### What it does not show

- Aquarius. Its router may ask for authorization in another shape.
- The mainnet router with a real signature. The snapshot tests below run its code with mocked
  authorization and get the same tree: guard, router, USDC transfer from the user to the pair.
- Real USDC and EURC, a route of more than one hop, or mainnet fees.

## Run

Needs Rust (the version in `rust-toolchain.toml` at the repo root) and `stellar-cli` 30.

```sh
cd spike
cargo test                 # 8 tests, offline
stellar contract build     # target/wasm32v1-none/release/spike_guard.wasm
```

The testnet runs need the network and write keys to the keystore of `stellar-cli`, never to this
repo:

```sh
scripts/testnet_setup.sh                                  # once: accounts, assets, pool, guard
scripts/testnet_guarded_swap.sh <label> <amount_in> <min_out> [<mover_amount>]
scripts/testnet_costs.sh
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
