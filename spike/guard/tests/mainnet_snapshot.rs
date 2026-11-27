//! Runs the real mainnet contracts on mainnet state, read from `spike/snapshots/`.
//!
//! The state is that of one ledger, so the expected amounts are fixed. `spike/README.md` says how
//! the file was made.

use soroban_sdk::{Address, Env, IntoVal, Symbol, Vec, testutils::EnvTestConfig, vec};

const SNAPSHOT: &str = concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/../snapshots/soroswap-usdc-eurc.json"
);
const SOROSWAP_ROUTER: &str = "CAG5LRYQ5JVEUI5TEID72EYOVX44TTUJT5BQR2J6J77FH65PCCFAJDDH";
const USDC: &str = "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75";
const EURC: &str = "CDTKPWPLOURQA2SGTKTUQOWRCBZEORB4BWBOMJ3D3ZTQQSGE5F6JBQLV";

fn mainnet() -> Env {
    let mut env = Env::from_ledger_snapshot_file(SNAPSHOT);
    // Without this every test run writes the whole state back to disk.
    env.set_config(EnvTestConfig {
        capture_snapshot_at_drop: false,
    });
    env
}

#[test]
fn the_mainnet_soroswap_router_quotes_100_usdc_in_eurc() {
    let env = mainnet();
    let router = Address::from_str(&env, SOROSWAP_ROUTER);
    let route = vec![
        &env,
        Address::from_str(&env, USDC),
        Address::from_str(&env, EURC),
    ];

    let amounts: Vec<i128> = env.invoke_contract(
        &router,
        &Symbol::new(&env, "router_get_amounts_out"),
        vec![
            &env,
            1_000_000_000_i128.into_val(&env),
            route.into_val(&env),
        ],
    );

    assert_eq!(env.ledger().sequence(), 65_698_431);
    assert_eq!(amounts, vec![&env, 1_000_000_000, 917_403_921]);
}
