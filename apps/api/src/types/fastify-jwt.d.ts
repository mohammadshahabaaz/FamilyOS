import '@fastify/jwt'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      sub: string
      uniqueUserId: string
      tokenId?: string
      type?: string
    }
    user: {
      sub: string
      uniqueUserId: string
    }
  }
}
