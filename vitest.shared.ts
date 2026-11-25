import { defineConfig } from 'vitest/config';

// Shared by every package: resolve workspace packages from source, and expose
// describe/it/expect as globals so test files need no vitest import.
export default defineConfig({
  resolve: { conditions: ['@fairfx/source'] },
  ssr: { resolve: { conditions: ['@fairfx/source'] } },
  test: {
    globals: true,
    include: ['src/**/*.test.ts'],
  },
});
