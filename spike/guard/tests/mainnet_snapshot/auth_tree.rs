//! Reads the shape of what a user authorized.

use soroban_sdk::{
    Address, Symbol,
    testutils::{AuthorizedFunction, AuthorizedInvocation},
};

/// The calls of one authorization, outermost first, as (depth, contract, function).
pub fn calls(invocation: &AuthorizedInvocation) -> std::vec::Vec<(u32, Address, Symbol)> {
    let mut found = std::vec::Vec::new();
    collect(invocation, 0, &mut found);
    found
}

fn collect(
    invocation: &AuthorizedInvocation,
    depth: u32,
    found: &mut std::vec::Vec<(u32, Address, Symbol)>,
) {
    if let AuthorizedFunction::Contract((contract, function, _)) = &invocation.function {
        found.push((depth, contract.clone(), function.clone()));
    }
    for inner in &invocation.sub_invocations {
        collect(inner, depth + 1, found);
    }
}
