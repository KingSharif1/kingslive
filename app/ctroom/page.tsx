'use client';

import React, { Suspense } from 'react';
import { CtroomDashboard } from './components/CtroomDashboard';

export default function CtroomPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <CtroomDashboard />
    </Suspense>
  );
}
