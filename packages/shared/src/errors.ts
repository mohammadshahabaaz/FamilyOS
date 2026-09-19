export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly logLevel: 'info' | 'warn' | 'error' = 'error',
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class NotFoundError extends AppError {
  constructor(msg: string) {
    super(404, 'NOT_FOUND', msg, 'info')
  }
}

export class ForbiddenError extends AppError {
  constructor(msg: string) {
    super(403, 'FORBIDDEN', msg, 'warn')
  }
}

export class ConflictError extends AppError {
  constructor(msg: string) {
    super(409, 'CONFLICT', msg, 'warn')
  }
}

export class ValidationError extends AppError {
  constructor(msg: string) {
    super(400, 'VALIDATION', msg, 'info')
  }
}

export class UnauthorizedError extends AppError {
  constructor(msg: string) {
    super(401, 'UNAUTHORIZED', msg, 'info')
  }
}
