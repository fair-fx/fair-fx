import { defineConfig, mergeConfig } from 'vitest/config';
import shared from '../../vitest.shared.ts';

// The run test writes to Postgres, so the collector's tests use the global setup of db's tests: one
// server in a container for the whole run. Named by path: a global setup is loaded without the
// `@fair-fx/source` condition, so the package name would not resolve to it.
export default mergeConfig(
  shared,
  defineConfig({ test: { globalSetup: ['../../packages/db/src/testing/global-setup.ts'] } }),
);
