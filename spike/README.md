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
| Toolchain pinned, minimal contract builds to wasm | Done |
| Unit tests with a test venue (mocked authorization) | Done, 4 tests |
| Mainnet state loaded from a ledger snapshot | Not confirmed yet |
| Soroswap on testnet, signed | Not started |
| Aquarius on testnet, signed | Not started |
| Costs, path payment with `destMin`, oracle read from a contract | Not started |

## Run

Needs Rust (the version in `rust-toolchain.toml` at the repo root) and `stellar-cli` 30.

```sh
cd spike
cargo test                 # 4 unit tests, offline
stellar contract build     # target/wasm32v1-none/release/spike_guard.wasm
```

## Mainnet state

One test runs the real mainnet router on mainnet state. It is ignored unless a snapshot file exists.

```sh
STELLAR_RPC_URL=https://mainnet.sorobanrpc.com \
STELLAR_NETWORK_PASSPHRASE='Public Global Stellar Network ; September 2015' \
stellar snapshot create \
  --address CAG5LRYQ5JVEUI5TEID72EYOVX44TTUJT5BQR2J6J77FH65PCCFAJDDH \
  --address CA4HEQTL2WPEUYKYKCDOHCDNIV4QHNJ7EL4J4NQ6VADP7SYHVRYZ7AW2 \
  --address CC7CDFY2VGDODJ7WPO3JIK2MXLOAXL4LRQCC43UJDBAIJ4SVFO3HNPOC \
  --address CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75 \
  --address CDTKPWPLOURQA2SGTKTUQOWRCBZEORB4BWBOMJ3D3ZTQQSGE5F6JBQLV \
  --out /tmp/soroswap-usdc-eurc.json

SPIKE_SNAPSHOT=/tmp/soroswap-usdc-eurc.json cargo test -- --ignored --nocapture
```

The five addresses are the Soroswap router, its factory, the USDC/EURC pair, and the USDC and EURC
token contracts. The command downloads the whole mainnet bucket list from the history archive.
