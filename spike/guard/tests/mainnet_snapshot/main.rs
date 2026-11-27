//! Runs the real mainnet contracts on mainnet state, read from `spike/snapshots/`.
//!
//! Each snapshot is the state of one ledger, so the expected amounts are fixed. `spike/README.md`
//! says how the files were made.

mod aquarius;
mod auth_tree;
mod soroswap;
mod world;
