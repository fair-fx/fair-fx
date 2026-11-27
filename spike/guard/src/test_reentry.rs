use soroban_sdk::{Address, Env, IntoVal, Symbol, Val, Vec, testutils::Address as _, vec};

use crate::{SpikeGuard, SpikeGuardClient, test_venue::ReentrantVenue};

#[test]
#[should_panic(expected = "Contract re-entry is not allowed")]
fn a_venue_that_calls_the_guard_back_is_stopped_by_the_host() {
    let env = Env::default();
    env.mock_all_auths();
    let guard = env.register(SpikeGuard, ());
    let venue = env.register(ReentrantVenue, ());
    let user = Address::generate(&env);
    let issuer = Address::generate(&env);
    let asset_in = env
        .register_stellar_asset_contract_v2(issuer.clone())
        .address();
    let asset_out = env.register_stellar_asset_contract_v2(issuer).address();
    let swap = Symbol::new(&env, "swap");
    let no_args: Vec<Val> = vec![&env];
    let second_call: Vec<Val> = vec![
        &env,
        user.to_val(),
        user.to_val(),
        asset_in.to_val(),
        asset_out.to_val(),
        1_i128.into_val(&env),
        0_i128.into_val(&env),
        venue.to_val(),
        swap.to_val(),
        no_args.to_val(),
    ];
    let venue_args: Vec<Val> = vec![&env, guard.to_val(), second_call.to_val()];

    SpikeGuardClient::new(&env, &guard).guarded_swap(
        &user,
        &user,
        &asset_in,
        &asset_out,
        &1,
        &0,
        &venue,
        &swap,
        &venue_args,
    );
}
