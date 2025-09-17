"use client"

import { useState, useCallback } from 'react'

export interface ErrorState {
  message: string
  code?: string
  status?: number
}

export function useErrorHandler() {
  const [error, setError] = useState<ErrorState | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleError = useCallback((error: unknown) => {
    console.error('Client Error:', error)

    if (error instanceof Error) {
      setError({
        message: error.message,
        code: 'CLIENT_ERROR'
      })
    } else if (typeof error === 'string') {
      setError({
        message: error,
        code: 'CLIENT_ERROR'
      })
    } else {
      setError({
        message: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR'
      })
    }
  }, [])

  const handleAPIError = useCallback(async (response: Response) => {
    try {
      const errorData = await response.json()
      setError({
        message: errorData.error || 'API request failed',
        code: errorData.code,
        status: response.status
      })
    } catch {
      setError({
        message: `Request failed with status ${response.status}`,
        code: 'API_ERROR',
        status: response.status
      })
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const withErrorHandling = useCallback(
    async <T>(asyncFn: () => Promise<T>): Promise<T | null> => {
      try {
        setIsLoading(true)
        clearError()
        return await asyncFn()
      } catch (error) {
        handleError(error)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [handleError, clearError]
  )

  return {
    error,
    isLoading,
    handleError,
    handleAPIError,
    clearError,
    withErrorHandling
  }
}