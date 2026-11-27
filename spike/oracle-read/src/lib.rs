//! Spike: read a fiat price from a Reflector feed inside a contract, and refuse an old one.
//!
//! Access model: one read function, anyone may call it, no storage, no admin.
//!
//! Throwaway code, kept apart from the guard so the deployed guard's wasm does not change.
#![no_std]

use soroban_sdk::{
    Address, Env, Symbol, contract, contractclient, contracterror, contractimpl, contracttype,
};

#[cfg(test)]
mod test;
#[cfg(test)]
mod test_feed;

/// The asset key of a Reflector feed. A fiat currency is `Other` with its code.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum Asset {
    Stellar(Address),
    Other(Symbol),
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PriceData {
    pub price: i128,
    pub timestamp: u64,
}

/// The one function of a Reflector feed this spike calls.
#[contractclient(name = "FeedClient")]
pub trait Feed {
    fn lastprice(env: Env, asset: Asset) -> Option<PriceData>;
}

/// Codes match the error table of the `fx_guard` design.
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    OracleMissing = 4,
    OracleStale = 5,
    OracleInvalid = 6,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct FiatPrice {
    pub price: i128,
    pub oracle_time: u64,
    pub age_seconds: u64,
}

#[contract]
pub struct OracleRead;

#[contractimpl]
impl OracleRead {
    /// The feed's last price of `symbol`, or an error when there is none, when it is not
    /// positive, or when it is more than `max_age_seconds` older than the ledger.
    pub fn fiat_price(
        env: Env,
        oracle: Address,
        symbol: Symbol,
        max_age_seconds: u64,
    ) -> Result<FiatPrice, Error> {
        let last = FeedClient::new(&env, &oracle)
            .lastprice(&Asset::Other(symbol))
            .ok_or(Error::OracleMissing)?;
        if last.price <= 0 {
            return Err(Error::OracleInvalid);
        }
        // A price dated after the ledger is refused: the design does not say what it means.
        let age_seconds = env
            .ledger()
            .timestamp()
            .checked_sub(last.timestamp)
            .ok_or(Error::OracleInvalid)?;
        if age_seconds > max_age_seconds {
            return Err(Error::OracleStale);
        }
        Ok(FiatPrice {
            price: last.price,
            oracle_time: last.timestamp,
            age_seconds,
        })
    }
}
