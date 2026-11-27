use soroban_sdk::{Address, IntoVal, Symbol, Vec, vec};

use crate::world::{EURC, SOROSWAP_ROUTER, USDC, mainnet};

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
