//! Spike for Q-2 and Q-3: the smallest `guarded_swap` that can sit above a real router.
//!
//! Access model: anyone may call `guarded_swap`, and it does nothing unless `user` authorized
//! this exact call, arguments included. The contract has no admin, no storage and never holds a
//! token: the venue moves the tokens between the user, its pools and the recipient.
//!
//! Throwaway code. The floor is passed in as `min_out`; the real contract computes it from the
//! oracle and a policy.
#![no_std]

use soroban_sdk::{
    Address, Env, Symbol, Val, Vec, contract, contracterror, contractimpl, contracttype,
    token::TokenClient,
};

#[cfg(test)]
mod test;
#[cfg(test)]
mod test_venue;

/// Codes match the error table of the `fx_guard` design, so notes from the spike read the same.
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AmountOutOfRange = 2,
    BelowFloor = 8,
    OverSpent = 9,
    MathOverflow = 10,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SwapResult {
    pub spent: i128,
    pub received: i128,
}

#[contract]
pub struct SpikeGuard;

#[contractimpl]
impl SpikeGuard {
    /// Calls `venue.func(args)` and fails, undoing the swap, unless `recipient` received at least
    /// `min_out` of `asset_out` and `user` spent at most `amount_in` of `asset_in`.
    ///
    /// Both amounts are read from token balances, never from what the venue returns.
    #[allow(clippy::too_many_arguments)]
    pub fn guarded_swap(
        env: Env,
        user: Address,
        recipient: Address,
        asset_in: Address,
        asset_out: Address,
        amount_in: i128,
        min_out: i128,
        venue: Address,
        func: Symbol,
        args: Vec<Val>,
    ) -> Result<SwapResult, Error> {
        user.require_auth();
        if amount_in <= 0 {
            return Err(Error::AmountOutOfRange);
        }

        let token_in = TokenClient::new(&env, &asset_in);
        let token_out = TokenClient::new(&env, &asset_out);
        let in_before = token_in.balance(&user);
        let out_before = token_out.balance(&recipient);

        let _: Val = env.invoke_contract(&venue, &func, args);

        let spent = in_before
            .checked_sub(token_in.balance(&user))
            .ok_or(Error::MathOverflow)?;
        let received = token_out
            .balance(&recipient)
            .checked_sub(out_before)
            .ok_or(Error::MathOverflow)?;

        if spent > amount_in {
            return Err(Error::OverSpent);
        }
        if received < min_out {
            return Err(Error::BelowFloor);
        }
        Ok(SwapResult { spent, received })
    }
}
