import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { conditions: ['@fair-fx/source'] },
  ssr: { resolve: { conditions: ['@fair-fx/source'] } },
  test: {
    globals: true,
    include: ['src/**/*.test.ts'],
  },
});
