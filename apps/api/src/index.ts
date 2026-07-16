import { buildApp } from './app.js'

const start = async () => {
  const app = await buildApp()
  const port = Number(process.env.PORT) || 3000
  const host = process.env.HOST || '0.0.0.0'

  await app.listen({ port, host })
}

start().catch((err) => {
  console.error(err)
  process.exit(1)
})
