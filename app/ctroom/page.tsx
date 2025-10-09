"use client"

import { Suspense } from 'react'
import QueryProvider from './components/QueryProvider'
import CtroomContent from './components/CtroomContent'
import ErrorBoundary from './components/ErrorBoundary'
import LoadingScreen from './components/LoadingScreen'

export default function CtroomPage() {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <Suspense fallback={<LoadingScreen />}>
          <CtroomContent />
        </Suspense>
      </QueryProvider>
    </ErrorBoundary>
  )
}
