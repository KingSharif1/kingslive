import { NAME_COOKIE, NAME_STORAGE_KEY } from '@/lib/blog/engagement'

/** Name only. localStorage first, cookie if storage is blocked. */
export function readDisplayName(): string {
  if (typeof window === 'undefined') return ''
  try {
    const stored = window.localStorage.getItem(NAME_STORAGE_KEY)
    if (stored && stored.trim()) return stored.trim()
  } catch {
    /* private mode */
  }
  const match = document.cookie.match(new RegExp(`(?:^|; )${NAME_COOKIE}=([^;]*)`))
  if (!match) return ''
  try {
    return decodeURIComponent(match[1]).trim()
  } catch {
    return ''
  }
}

export function rememberDisplayName(name: string): void {
  const trimmed = name.trim()
  if (!trimmed || typeof window === 'undefined') return
  try {
    window.localStorage.setItem(NAME_STORAGE_KEY, trimmed)
  } catch {
    /* private mode */
  }
  document.cookie = `${NAME_COOKIE}=${encodeURIComponent(trimmed)}; Path=/; Max-Age=31536000; SameSite=Lax`
}
