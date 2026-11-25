import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { conditions: ['@fairfx/source'] },
  ssr: { resolve: { conditions: ['@fairfx/source'] } },
});
