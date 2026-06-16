import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/tests/**/*.e2e.test.ts'],
    pool: 'forks',
    fileParallelism: false,
  },
});
