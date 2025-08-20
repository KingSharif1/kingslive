import React from 'react'
import { Loader2 } from 'lucide-react'

const LoadingScreen = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background rounded-2xl border animate-bounce animate-duration-[2s] animate-infinite animate-ease-in-out">
      <div className="p-8 rounded-xl shadow-lg bg-card flex flex-col items-center space-y-4 border border-teal-500 dark:border-teal-500/50 backdrop-blur-xl backdrop-contrast-150 backdrop-brightness-150 backdrop-invert-100 ring-2 ring-teal-500 dark:ring-teal-500/50">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <h2 className="text-2xl font-bold">Loading Control Room</h2>
        <p className="text-muted-foreground">Verifying your credentials...</p>
      </div>
    </div>
  )
}

export default LoadingScreen
