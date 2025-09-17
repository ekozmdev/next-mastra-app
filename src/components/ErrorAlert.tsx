"use client"

import { AlertTriangle, X, Info, CheckCircle, XCircle } from 'lucide-react'
import { ErrorState } from '@/hooks/useErrorHandler'

interface ErrorAlertProps {
  error: ErrorState | null
  onClose?: () => void
  variant?: 'error' | 'warning' | 'info' | 'success'
  className?: string
}

export function ErrorAlert({ 
  error, 
  onClose, 
  variant = 'error',
  className = '' 
}: ErrorAlertProps) {
  if (!error) return null

  const variants = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: XCircle,
      iconColor: 'text-red-500'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: AlertTriangle,
      iconColor: 'text-yellow-500'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: Info,
      iconColor: 'text-blue-500'
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: CheckCircle,
      iconColor: 'text-green-500'
    }
  }

  const config = variants[variant]
  const Icon = config.icon

  return (
    <div className={`${config.bg} ${config.border} border rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <Icon className={`w-5 h-5 ${config.iconColor} mt-0.5 flex-shrink-0`} />
        <div className="ml-3 flex-1">
          <p className={`text-sm font-medium ${config.text}`}>
            {error.message}
          </p>
          {error.code && (
            <p className={`text-xs ${config.text} opacity-75 mt-1`}>
              エラーコード: {error.code}
            </p>
          )}
          {error.status && (
            <p className={`text-xs ${config.text} opacity-75 mt-1`}>
              ステータス: {error.status}
            </p>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`ml-3 ${config.text} hover:opacity-75 transition-opacity`}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

interface InlineErrorProps {
  message?: string
  className?: string
}

export function InlineError({ message, className = '' }: InlineErrorProps) {
  if (!message) return null

  return (
    <div className={`flex items-center space-x-2 text-red-600 text-sm ${className}`}>
      <XCircle className="w-4 h-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  )
}

interface LoadingErrorProps {
  error: ErrorState | null
  onRetry?: () => void
  className?: string
}

export function LoadingError({ error, onRetry, className = '' }: LoadingErrorProps) {
  if (!error) return null

  return (
    <div className={`text-center py-8 ${className}`}>
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <XCircle className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-lg font-medium text-gray-800 mb-2">
        読み込みエラー
      </h3>
      <p className="text-gray-600 mb-4">
        {error.message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          再試行
        </button>
      )}
    </div>
  )
}