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
| Soroswap on testnet, signed | Not started |
| Aquarius on testnet, signed | Not started |
| Costs, path payment with `destMin`, oracle read from a contract | Not started |

Nothing above answers question 1 yet.

## Run

Needs Rust (the version in `rust-toolchain.toml` at the repo root) and `stellar-cli` 30.

```sh
cd spike
cargo test                 # 5 tests, offline
stellar contract build     # target/wasm32v1-none/release/spike_guard.wasm
```

## Mainnet state

`snapshots/soroswap-usdc-eurc.json` is mainnet at ledger 65698431 (2026-11-27 11:17 UTC): the
Soroswap router, its factory, the USDC/EURC pair with its two token balances, and the USDC and EURC
token contracts. One test runs the mainnet router on it and gets 91.7403921 EURC for 100 USDC, the
amount the FairFX collector stored from the live network at 09:55 UTC that day.

It was made in three steps. The first downloads the mainnet bucket list, 14 GB on disk, into the
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
```

Two things to know about the file:

- `stellar snapshot create` of stellar-cli 30.0.1 writes contract data only. It leaves out the wasm
  of the contracts and the issuer accounts, so the second step reads the three wasm entries from
  the RPC. The issuer accounts and the expiry ledgers of the entries are still missing.
- The third step drops 53,221 balances and allowances of other holders, which takes the file from
  73 MB to 0.3 MB.

A test on this file runs real mainnet code on real mainnet state, with mocked authorization. It can
show what a router does and what it costs. It cannot show that a signature is accepted.
