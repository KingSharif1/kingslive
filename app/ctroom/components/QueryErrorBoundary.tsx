"use client"

import { QueryErrorResetBoundary } from '@tanstack/react-query'
import ErrorBoundary from './ErrorBoundary'
import { AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'

interface QueryErrorFallbackProps {
  error?: Error
  resetError: () => void
}

function QueryErrorFallback({ error, resetError }: QueryErrorFallbackProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const isNetworkError = error?.message?.toLowerCase().includes('network') || 
                        error?.message?.toLowerCase().includes('fetch') ||
                        !isOnline

  return (
    <div className="flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center border border-red-200 dark:border-red-800">
        <div className="flex justify-center mb-4">
          {isNetworkError ? (
            <WifiOff className="h-12 w-12 text-red-500" />
          ) : (
            <AlertCircle className="h-12 w-12 text-red-500" />
          )}
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {isNetworkError ? 'Connection Problem' : 'Data Loading Error'}
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {isNetworkError 
            ? 'Unable to connect to the server. Please check your internet connection.'
            : 'There was a problem loading your data. This might be temporary.'
          }
        </p>

        {!isOnline && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-center justify-center">
              <WifiOff className="h-4 w-4 mr-2" />
              You appear to be offline
            </p>
          </div>
        )}
        
        <div className="mt-4 flex items-center justify-center">  
          <button
            onClick={resetError}
            disabled={!isOnline && isNetworkError}
            className="w-fit flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {isNetworkError ? 'Retry Connection' : 'Try Again'}
          </button>          
        </div>

      </div>
    </div>
  )
}

interface QueryErrorBoundaryProps {
  children: React.ReactNode
}

export default function QueryErrorBoundary({ children }: QueryErrorBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary fallback={({ error }) => <QueryErrorFallback error={error} resetError={reset} />}>
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  )
}
