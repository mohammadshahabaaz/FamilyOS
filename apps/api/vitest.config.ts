import { defineConfig } from 'vitest/config'

process.loadEnvFile('.env')

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
