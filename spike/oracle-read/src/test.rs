use soroban_sdk::{Address, Env, Symbol, testutils::Ledger as _};

use crate::{
    Error, FiatPrice, OracleRead, OracleReadClient, PriceData,
    test_feed::{TestFeed, TestFeedClient},
};

const NOW: u64 = 1_000_000;
const MAX_AGE_SECONDS: u64 = 600;

struct World {
    env: Env,
    reader: Address,
    feed: Address,
}

/// A ledger at NOW and a feed whose last price is `last`.
fn world(last: Option<PriceData>) -> World {
    let env = Env::default();
    env.ledger().set_timestamp(NOW);
    let feed = env.register(TestFeed, ());
    TestFeedClient::new(&env, &feed).set(&last);
    World {
        reader: env.register(OracleRead, ()),
        feed,
        env,
    }
}

impl World {
    fn fiat_price(&self) -> Result<FiatPrice, Error> {
        OracleReadClient::new(&self.env, &self.reader)
            .try_fiat_price(&self.feed, &Symbol::new(&self.env, "EUR"), &MAX_AGE_SECONDS)
            .map(|price| price.expect("the price decodes"))
            .map_err(|error| error.expect("the error is one of the reader's"))
    }
}

fn price_at(price: i128, timestamp: u64) -> Option<PriceData> {
    Some(PriceData { price, timestamp })
}

#[test]
fn a_price_exactly_at_the_age_limit_is_returned_with_its_age() {
    let world = world(price_at(109_656_695_371_968, 999_400));

    let price = world.fiat_price();

    assert_eq!(
        price,
        Ok(FiatPrice {
            price: 109_656_695_371_968,
            oracle_time: 999_400,
            age_seconds: 600
        })
    );
}

#[test]
fn a_price_one_second_past_the_age_limit_is_stale() {
    let world = world(price_at(109_656_695_371_968, 999_399));

    let price = world.fiat_price();

    assert_eq!(price, Err(Error::OracleStale));
}

#[test]
fn a_feed_with_no_price_is_missing() {
    let world = world(None);

    let price = world.fiat_price();

    assert_eq!(price, Err(Error::OracleMissing));
}

#[test]
fn a_price_of_zero_is_invalid() {
    let world = world(price_at(0, 999_900));

    let price = world.fiat_price();

    assert_eq!(price, Err(Error::OracleInvalid));
}

#[test]
fn a_price_dated_after_the_ledger_is_invalid() {
    let world = world(price_at(109_656_695_371_968, 1_000_001));

    let price = world.fiat_price();

    assert_eq!(price, Err(Error::OracleInvalid));
}
