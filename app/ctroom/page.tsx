"use client"

import { useToast, ToastContainer } from './components/Toast'
import QueryProvider from './components/QueryProvider'
import ErrorBoundary from './components/ErrorBoundary'
import { DashboardLayout } from './components/dashboard/Layout'
import { Dashboard } from './components/dashboard/Dashboard'

export default function CtroomPage() {
  const { toasts, addToast, removeToast } = useToast()
  
  return (
    <ErrorBoundary>
      <QueryProvider>
        <DashboardLayout>
          <Dashboard addToast={addToast} />
        </DashboardLayout>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </QueryProvider>
    </ErrorBoundary>
  )
}
