import fp from 'fastify-plugin'
import type { FastifyPluginAsync, FastifyError } from 'fastify'

function hasProp<K extends string>(obj: object, key: K): obj is Record<K, unknown> {
  return key in obj
}

// Use name-check instead of instanceof — tsx ESM loader can produce separate module
// instances for the same package across symlinked workspace paths, breaking instanceof.
function isZodError(e: unknown): e is { name: string; issues: unknown[] } {
  return typeof e === 'object' && e !== null && hasProp(e, 'name') && e.name === 'ZodError'
}

function isAppError(e: unknown): e is {
  name: string
  statusCode: number
  code: string
  message: string
  logLevel: 'info' | 'warn' | 'error'
} {
  return (
    typeof e === 'object' &&
    e !== null &&
    hasProp(e, 'name') &&
    e.name === 'AppError' &&
    hasProp(e, 'statusCode') &&
    typeof e.statusCode === 'number' &&
    hasProp(e, 'code') &&
    typeof e.code === 'string'
  )
}

const errorHandlerPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.setErrorHandler((error: FastifyError, request, reply) => {
    // The minimum viable observability fields for on-call to debug from logs alone —
    // traceId ties this line back to every other log line for the same request
    // (see genReqId/requestIdLogLabel in app.ts), module is the matched route
    // pattern (stable across param values, unlike the raw URL).
    const logContext = {
      err: error,
      traceId: request.id,
      userId: request.user?.sub,
      module: request.routeOptions.url ?? request.url,
    }

    if (isZodError(error)) {
      fastify.log.info({ ...logContext, errorCode: 'VALIDATION' }, error.message)
      return reply.status(400).send({
        statusCode: 400,
        error: 'Validation Error',
        issues: error.issues,
      })
    }

    if (isAppError(error)) {
      fastify.log[error.logLevel]({ ...logContext, errorCode: error.code }, error.message)
      return reply.status(error.statusCode).send({
        error: { code: error.code, message: error.message },
      })
    }

    const status = error.statusCode ?? 500
    if (status < 500) {
      fastify.log.info({ ...logContext, errorCode: error.name }, error.message)
      return reply.status(status).send({
        statusCode: status,
        error: error.name,
        message: error.message,
      })
    }

    fastify.log.error({ ...logContext, errorCode: 'INTERNAL' }, error.message)
    return reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
    })
  })
}

export default fp(errorHandlerPlugin)
