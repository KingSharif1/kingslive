"use client"

import { useState, useEffect } from "react"
import { X, Check, AlertCircle, Info } from "lucide-react"

export interface ToastProps {
  id: string
  type: 'success' | 'error' | 'info'
  title: string
  message?: string
  duration?: number
}

interface ToastContextType {
  toasts: ToastProps[]
  addToast: (toast: Omit<ToastProps, 'id'>) => void
  removeToast: (id: string) => void
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const addToast = (toast: Omit<ToastProps, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...toast, id }
    setToasts(prev => [...prev, newToast])

    // Auto remove after duration
    setTimeout(() => {
      removeToast(id)
    }, toast.duration || 3000)
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  return { toasts, addToast, removeToast }
}

export function ToastContainer({ toasts, removeToast }: { toasts: ToastProps[], removeToast: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

function Toast({ type, title, message, onClose }: ToastProps & { onClose: () => void }) {
  const icons = {
    success: Check,
    error: AlertCircle,
    info: Info
  }

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
  }

  const Icon = icons[type]

  return (
    <div className="bg-card border border-border rounded-xl shadow-lg p-4 min-w-[300px] max-w-[400px]">
      <div className="flex items-start gap-3">
        <div className={`${colors[type]} p-1 rounded-full`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-foreground">{title}</h4>
          {message && (
            <p className="text-sm text-muted-foreground mt-1">{message}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
