"use client"

import { Suspense } from 'react'
import QueryProvider from './components/QueryProvider'
import ErrorBoundary from './components/ErrorBoundary'
<<<<<<< HEAD
import LoadingScreen from './components/LoadingScreen'
=======
import { DashboardLayout } from './components/dashboard/Layout'
import { Dashboard } from './components/dashboard/Dashboard'
>>>>>>> 690bc2255d2e435ff9e96c0ccbc6a058f8992be2

export default function CtroomPage() {
  return (
    <ErrorBoundary>
      <QueryProvider>
<<<<<<< HEAD
        <Suspense fallback={<LoadingScreen />}>
          <CtroomContent />
        </Suspense>
=======
        <DashboardLayout>
          <Dashboard addToast={addToast} />
        </DashboardLayout>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
>>>>>>> 690bc2255d2e435ff9e96c0ccbc6a058f8992be2
      </QueryProvider>
    </ErrorBoundary>
  )
}
