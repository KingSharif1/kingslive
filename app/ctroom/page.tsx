"use client"

import { Suspense } from 'react'
import QueryProvider from './components/QueryProvider'
import ErrorBoundary from './components/ErrorBoundary'

export default function CtroomPage() {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <CtroomContent addToast={addToast} />
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </QueryProvider>
    </ErrorBoundary>
  )
}
