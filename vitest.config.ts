import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/route-tree/**/*.test.ts', 'metro/**/*.test.ts'],
    globals: false,
  },
});
