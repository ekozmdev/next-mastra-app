/**
 * Custom API Error classes for consistent error handling
 */

export class APIError extends Error {
  constructor(
    public message: string,
    public status: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export class ValidationError extends APIError {
  constructor(message: string, public field?: string) {
    super(message, 400, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends APIError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR')
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends APIError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR')
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends APIError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR')
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends APIError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT_ERROR')
    this.name = 'ConflictError'
  }
}

export class DatabaseError extends APIError {
  constructor(message: string = 'Database operation failed') {
    super(message, 500, 'DATABASE_ERROR')
    this.name = 'DatabaseError'
  }
}

export class ExternalServiceError extends APIError {
  constructor(message: string = 'External service error') {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR')
    this.name = 'ExternalServiceError'
  }
}

/**
 * API Error Handler for consistent error responses
 */
export function handleAPIError(error: unknown): Response {
  console.error('API Error:', error)

  if (error instanceof APIError) {
    return Response.json(
      {
        error: error.message,
        code: error.code,
        status: error.status
      },
      { status: error.status }
    )
  }

  if (error instanceof Error) {
    return Response.json(
      {
        error: error.message,
        code: 'INTERNAL_ERROR',
        status: 500
      },
      { status: 500 }
    )
  }

  return Response.json(
    {
      error: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      status: 500
    },
    { status: 500 }
  )
}

/**
 * Async error wrapper for API routes
 */
export function withErrorHandler(
  handler: (req: Request, context?: Record<string, unknown>) => Promise<Response>
) {
  return async (req: Request, context?: Record<string, unknown>): Promise<Response> => {
    try {
      return await handler(req, context)
    } catch (error) {
      return handleAPIError(error)
    }
  }
}

/**
 * Validation helper functions
 */
export function validateRequired(value: unknown, fieldName: string): void {
  if (
    value === undefined ||
    value === null ||
    (typeof value === 'string' && value.trim() === '')
  ) {
    throw new ValidationError(`${fieldName} is required`)
  }
}

export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format')
  }
}

export function validatePassword(password: string): void {
  if (password.length < 6) {
    throw new ValidationError('Password must be at least 6 characters long')
  }
}
