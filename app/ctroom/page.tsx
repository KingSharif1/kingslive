"use client"

import { useToast, ToastContainer } from './components/Toast'
import QueryProvider from './components/QueryProvider'
import CtroomContent from './components/CtroomContent'
import ErrorBoundary from './components/ErrorBoundary'

export default function CtroomPage() {
  const { toasts, addToast, removeToast } = useToast()
  
  return (
    <ErrorBoundary>
      <QueryProvider>
        <CtroomContent addToast={addToast} />
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </QueryProvider>
    </ErrorBoundary>
  )
}
