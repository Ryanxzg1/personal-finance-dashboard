import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup/integration.ts'],
    include: ['**/tests/integration/**/*.test.ts'],
    testTimeout: 20000,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
    },
  },
})
