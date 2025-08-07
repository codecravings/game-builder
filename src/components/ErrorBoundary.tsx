import React, { Component, ReactNode } from 'react'
import { motion } from 'framer-motion'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: string
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: ''
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: error.stack || 'No stack trace available'
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    
    // Log error to external service here if needed
    this.setState({
      errorInfo: errorInfo.componentStack || 'No component stack available'
    })
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: ''
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <motion.div
          className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900/20 to-slate-900 p-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="max-w-lg w-full bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 border border-red-500/30">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">💥</div>
              <h2 className="text-2xl font-bold text-red-400 mb-2">
                Oops! Something went wrong
              </h2>
              <p className="text-gray-400">
                The AI Game Engine encountered an unexpected error
              </p>
            </div>

            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
              <h3 className="text-red-300 font-semibold mb-2">Error Details:</h3>
              <div className="text-sm text-red-200 font-mono bg-black/30 rounded p-3 overflow-auto max-h-32">
                {this.state.error?.message || 'Unknown error occurred'}
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={this.handleRetry}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                🔄 Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
              >
                🏠 Reload Page
              </button>
            </div>

            <details className="mt-6">
              <summary className="text-gray-400 text-sm cursor-pointer hover:text-white">
                Show technical details
              </summary>
              <div className="mt-2 text-xs text-gray-500 font-mono bg-black/30 rounded p-3 overflow-auto max-h-40">
                {this.state.errorInfo}
              </div>
            </details>
          </div>
        </motion.div>
      )
    }

    return this.props.children
  }
}

// Functional error display component
interface ErrorDisplayProps {
  error: string
  onRetry?: () => void
  onDismiss?: () => void
  type?: 'error' | 'warning' | 'info'
}

export function ErrorDisplay({ error, onRetry, onDismiss, type = 'error' }: ErrorDisplayProps) {
  const colors = {
    error: 'red',
    warning: 'yellow',
    info: 'blue'
  }
  
  const color = colors[type]
  const icons = {
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  }

  return (
    <motion.div
      className={`bg-${color}-900/20 border border-${color}-500/30 rounded-lg p-4 mb-4`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="flex items-start space-x-3">
        <div className="text-2xl">{icons[type]}</div>
        <div className="flex-1">
          <div className={`text-${color}-300 font-semibold mb-1`}>
            {type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : 'Information'}
          </div>
          <div className={`text-${color}-200 text-sm`}>
            {error}
          </div>
        </div>
        <div className="flex space-x-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className={`px-3 py-1 bg-${color}-600 hover:bg-${color}-700 text-white rounded text-sm font-semibold transition-colors`}
            >
              Retry
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// Toast notification system
interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  onDismiss: () => void
}

export function Toast({ message, type = 'info', duration = 5000, onDismiss }: ToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(onDismiss, duration)
    return () => clearTimeout(timer)
  }, [duration, onDismiss])

  const colors = {
    success: 'green',
    error: 'red',
    warning: 'yellow',
    info: 'blue'
  }
  
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  }

  const color = colors[type]

  return (
    <motion.div
      className={`fixed top-4 right-4 z-50 bg-${color}-600 text-white px-4 py-3 rounded-lg shadow-lg min-w-64 max-w-sm`}
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
    >
      <div className="flex items-center space-x-3">
        <div className="text-lg">{icons[type]}</div>
        <div className="flex-1 text-sm font-medium">{message}</div>
        <button
          onClick={onDismiss}
          className="text-white/80 hover:text-white"
        >
          ×
        </button>
      </div>
    </motion.div>
  )
}

// Hook for managing toasts
export function useToasts() {
  const [toasts, setToasts] = React.useState<Array<{
    id: string
    message: string
    type: 'success' | 'error' | 'warning' | 'info'
    duration?: number
  }>>([])

  const addToast = React.useCallback((
    message: string, 
    type: 'success' | 'error' | 'warning' | 'info' = 'info',
    duration = 5000
  ) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { id, message, type, duration }])
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const ToastContainer = React.useMemo(() => {
    return () => (
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onDismiss={() => removeToast(toast.id)}
          />
        ))}
      </div>
    )
  }, [toasts, removeToast])

  return {
    addToast,
    removeToast,
    ToastContainer
  }
}