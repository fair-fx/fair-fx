import { defineConfig, mergeConfig } from 'vitest/config';
import shared from '../../vitest.shared.ts';

// Every test file here needs a Postgres server: the global setup starts one in a container.
export default mergeConfig(shared, defineConfig({ test: { globalSetup: ['src/testing/global-setup.ts'] } }));
