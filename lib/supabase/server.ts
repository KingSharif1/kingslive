import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// This is a workaround for the type mismatch in Next.js cookies API
type CookieStore = ReturnType<typeof cookies>

export function createClient() {
  // Cast to any to bypass the type checking issue
  const cookieStore = cookies() as any
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
        set(name, value, options) {
          cookieStore.set(name, value, options)
        },
        remove(name, options) {
          cookieStore.set(name, '', options)
        },
      },
    }
  )
}
