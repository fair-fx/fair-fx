//! A venue for unit tests. It takes and gives exactly what the test tells it to, so a test can
//! make it pay too little or take too much.

use soroban_sdk::{Address, Env, contract, contractimpl, token::TokenClient};

#[contract]
pub struct TestVenue;

#[contractimpl]
impl TestVenue {
    pub fn swap(
        env: Env,
        from: Address,
        to: Address,
        asset_in: Address,
        asset_out: Address,
        take: i128,
        give: i128,
    ) {
        from.require_auth();
        let venue = env.current_contract_address();
        TokenClient::new(&env, &asset_in).transfer(&from, &venue, &take);
        TokenClient::new(&env, &asset_out).transfer(&venue, &to, &give);
    }
}
