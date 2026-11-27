//! Runs the real mainnet contracts on mainnet state, read from a ledger snapshot file.
//!
//! Ignored by default, because the file is made from the history archive and is not in the repo.
//! `spike/README.md` has the command that makes it.

use soroban_sdk::{Address, Env, IntoVal, Symbol, Vec, vec};

const SNAPSHOT_ENV: &str = "SPIKE_SNAPSHOT";
const SOROSWAP_ROUTER: &str = "CAG5LRYQ5JVEUI5TEID72EYOVX44TTUJT5BQR2J6J77FH65PCCFAJDDH";
const USDC: &str = "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75";
const EURC: &str = "CDTKPWPLOURQA2SGTKTUQOWRCBZEORB4BWBOMJ3D3ZTQQSGE5F6JBQLV";
/// Both tokens have 7 decimals.
const UNIT: i128 = 10_000_000;

#[test]
#[ignore = "needs SPIKE_SNAPSHOT, the path of a mainnet ledger snapshot"]
fn the_mainnet_soroswap_router_quotes_100_usdc_in_eurc() {
    let path = std::env::var(SNAPSHOT_ENV).expect("SPIKE_SNAPSHOT is set");
    let env = Env::from_ledger_snapshot_file(path);
    let router = Address::from_str(&env, SOROSWAP_ROUTER);
    let route = vec![
        &env,
        Address::from_str(&env, USDC),
        Address::from_str(&env, EURC),
    ];

    let amounts: Vec<i128> = env.invoke_contract(
        &router,
        &Symbol::new(&env, "router_get_amounts_out"),
        vec![&env, (100 * UNIT).into_val(&env), route.into_val(&env)],
    );

    std::println!("ledger {}, amounts {amounts:?}", env.ledger().sequence());
    assert_eq!(amounts.len(), 2);
    assert_eq!(amounts.get_unchecked(0), 100 * UNIT);
    // Any EUR/USD rate of the last 20 years puts 100 USD between 60 and 100 EUR.
    assert!(amounts.get_unchecked(1) > 60 * UNIT);
    assert!(amounts.get_unchecked(1) < 100 * UNIT);
}
