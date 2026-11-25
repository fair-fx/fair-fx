# CLAUDE.md: fairfx code repo

Intent and behaviour live in the TDD repo (sibling folder `../TDD`). Read `../TDD/CLAUDE.md` first
and use its routing table to find the doc for a task. This file only covers how to work in the code.

## Rules

- Dependency direction is enforced by lint (D-17). Never weaken a constraint in `eslint.config.mjs`
  to make an import pass. If a new dependency seems necessary, it needs a decision in the TDD first.
- A new package gets `nx.tags` (`layer:*` or `app:*`, plus `scope:public` or `scope:private`) in its
  first commit, and a case in `scripts/check-boundaries.mjs` for each forbidden import it introduces.
- The main entry of `@fairfx/core` does no I/O. Node code goes under `packages/core/src/node`.
- TypeScript is pinned to 6.0.x: `typescript-eslint` 8.74 accepts TypeScript `<6.1` only.
- New dependencies must be older than pnpm's minimum release age; do not add
  `minimumReleaseAgeExclude` entries.
- Commit messages are conventional commits. No em dashes in code, comments or docs.

## Before saying done

```sh
pnpm check
```
