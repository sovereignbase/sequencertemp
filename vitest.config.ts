import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: [
      'test/convergence/**/*.test.ts',
      'test/convergence/**/test.ts',
      'test/stress/**/*.test.ts',
    ],
    environment: 'node',
    fileParallelism: false,
    coverage: {
      enabled: true,
      provider: 'v8',
      include: ['src/**/*.ts'],
      reporter: ['text', 'lcov'],
      reportOnFailure: true,
      thresholds: {
        lines: 100,
        branches: 100,
        functions: 100,
        statements: 100,
      },
    },
  },
})
