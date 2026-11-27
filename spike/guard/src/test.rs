use soroban_sdk::{
    Address, Env, IntoVal, Symbol, Val, Vec,
    testutils::Address as _,
    token::{StellarAssetClient, TokenClient},
    vec,
};

use crate::{Error, SpikeGuard, SpikeGuardClient, SwapResult, test_venue::TestVenue};

const USER_FUNDS: i128 = 1_000;
const VENUE_FUNDS: i128 = 1_000;
// Not zero, so a result read from the balance and not from its change is noticed.
const RECIPIENT_FUNDS: i128 = 7;

struct World {
    env: Env,
    guard: Address,
    venue: Address,
    user: Address,
    recipient: Address,
    asset_in: Address,
    asset_out: Address,
}

fn world() -> World {
    let env = Env::default();
    env.mock_all_auths();
    let issuer = Address::generate(&env);
    let user = Address::generate(&env);
    let recipient = Address::generate(&env);
    let guard = env.register(SpikeGuard, ());
    let venue = env.register(TestVenue, ());
    let asset_in = env
        .register_stellar_asset_contract_v2(issuer.clone())
        .address();
    let asset_out = env.register_stellar_asset_contract_v2(issuer).address();
    StellarAssetClient::new(&env, &asset_in).mint(&user, &USER_FUNDS);
    StellarAssetClient::new(&env, &asset_out).mint(&venue, &VENUE_FUNDS);
    StellarAssetClient::new(&env, &asset_out).mint(&recipient, &RECIPIENT_FUNDS);
    World {
        env,
        guard,
        venue,
        user,
        recipient,
        asset_in,
        asset_out,
    }
}

impl World {
    fn venue_args(&self, take: i128, give: i128) -> Vec<Val> {
        vec![
            &self.env,
            self.user.to_val(),
            self.recipient.to_val(),
            self.asset_in.to_val(),
            self.asset_out.to_val(),
            take.into_val(&self.env),
            give.into_val(&self.env),
        ]
    }

    fn guarded_swap(
        &self,
        amount_in: i128,
        min_out: i128,
        args: Vec<Val>,
    ) -> Result<SwapResult, Error> {
        let outcome = SpikeGuardClient::new(&self.env, &self.guard).try_guarded_swap(
            &self.user,
            &self.recipient,
            &self.asset_in,
            &self.asset_out,
            &amount_in,
            &min_out,
            &self.venue,
            &Symbol::new(&self.env, "swap"),
            &args,
        );
        match outcome {
            Ok(result) => Ok(result.expect("the result decodes")),
            Err(error) => Err(error.expect("the failure is a contract error")),
        }
    }

    fn balances(&self) -> (i128, i128) {
        (
            TokenClient::new(&self.env, &self.asset_in).balance(&self.user),
            TokenClient::new(&self.env, &self.asset_out).balance(&self.recipient),
        )
    }
}

#[test]
fn a_swap_that_pays_the_floor_goes_through() {
    let world = world();
    let args = world.venue_args(100, 91);

    let result = world.guarded_swap(100, 91, args);

    assert_eq!(
        result,
        Ok(SwapResult {
            spent: 100,
            received: 91
        })
    );
    assert_eq!(world.balances(), (900, 98));
}

#[test]
fn a_swap_that_pays_one_unit_under_the_floor_is_undone() {
    let world = world();
    let args = world.venue_args(100, 90);

    let result = world.guarded_swap(100, 91, args);

    assert_eq!(result, Err(Error::BelowFloor));
    assert_eq!(world.balances(), (1_000, 7));
}

#[test]
fn a_venue_that_takes_more_than_amount_in_is_undone() {
    let world = world();
    let args = world.venue_args(101, 95);

    let result = world.guarded_swap(100, 91, args);

    assert_eq!(result, Err(Error::OverSpent));
    assert_eq!(world.balances(), (1_000, 7));
}

#[test]
fn an_amount_in_of_zero_is_refused_before_the_venue_is_called() {
    let world = world();
    let args = world.venue_args(0, 50);

    let result = world.guarded_swap(0, 0, args);

    assert_eq!(result, Err(Error::AmountOutOfRange));
    assert_eq!(world.balances(), (1_000, 7));
}
