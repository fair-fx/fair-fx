//! Runs the real mainnet contracts on mainnet state, read from `spike/snapshots/`.
//!
//! The state is that of one ledger, so the expected amounts are fixed. `spike/README.md` says how
//! the file was made.

mod guard;
mod router;
mod world;
