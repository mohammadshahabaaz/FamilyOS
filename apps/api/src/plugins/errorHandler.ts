import fp from 'fastify-plugin'
import type { FastifyPluginAsync, FastifyError } from 'fastify'

// Use name-check instead of instanceof — tsx ESM loader can produce separate module
// instances for the same package across symlinked workspace paths, breaking instanceof.
function isZodError(e: unknown): e is { name: string; issues: unknown[] } {
  return typeof e === 'object' && e !== null && (e as any).name === 'ZodError'
}

const errorHandlerPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.setErrorHandler((error: FastifyError, _request, reply) => {
    if (isZodError(error)) {
      return reply.status(400).send({
        statusCode: 400,
        error:      'Validation Error',
        issues:     error.issues,
      })
    }

    const status = error.statusCode ?? 500
    if (status < 500) {
      return reply.status(status).send({
        statusCode: status,
        error:      error.name,
        message:    error.message,
      })
    }

    fastify.log.error(error)
    return reply.status(500).send({
      statusCode: 500,
      error:      'Internal Server Error',
      message:    'An unexpected error occurred',
    })
  })
}

export default fp(errorHandlerPlugin)
