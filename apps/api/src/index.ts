import { env } from './lib/env.js'
import { buildApp } from './app.js'

const start = async () => {
  const app = await buildApp()

  await app.listen({ port: env.PORT, host: env.HOST })
}

start().catch((err) => {
  console.error(err)
  process.exit(1)
})
