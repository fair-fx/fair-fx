//! A feed for unit tests: it answers `lastprice` with whatever the test stored.

use soroban_sdk::{Env, Symbol, contract, contractimpl, symbol_short};

use crate::{Asset, PriceData};

const LAST: Symbol = symbol_short!("last");

#[contract]
pub struct TestFeed;

#[contractimpl]
impl TestFeed {
    pub fn set(env: Env, last: Option<PriceData>) {
        env.storage().instance().set(&LAST, &last);
    }

    pub fn lastprice(env: Env, _asset: Asset) -> Option<PriceData> {
        env.storage().instance().get(&LAST).flatten()
    }
}
