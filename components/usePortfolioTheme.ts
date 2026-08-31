'use client'

import { useCallback, useEffect, useState } from 'react'

export function usePortfolioTheme() {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const darkMode = localStorage.getItem('darkMode') === 'true'
    setIsDark(darkMode)
    document.documentElement.classList.toggle('dark', darkMode)
  }, [])

  useEffect(() => {
    if (!mounted) return
    localStorage.setItem('darkMode', String(isDark))
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark, mounted])

  const toggleTheme = useCallback(() => setIsDark((v) => !v), [])

  return { isDark, mounted, toggleTheme }
}
