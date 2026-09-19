import { existsSync } from 'node:fs'
import { defineConfig } from 'vitest/config'

// Local runs read apps/api/.env; CI supplies the same vars via the workflow env.
if (existsSync('.env')) process.loadEnvFile('.env')

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
