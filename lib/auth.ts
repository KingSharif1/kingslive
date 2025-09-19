import { supabase } from './supabase'

// Simple cache for admin users to reduce database queries
const adminUserCache = new Map<string, boolean>()

export type AuthUser = {
  id: string
  email: string
  username?: string
  isAdmin: boolean
}

/**
 * Sign in with magic link (passwordless)
 * Sends a magic link to the user's email
 */
export async function signInWithMagicLink(email: string) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/ctroom`,
    },
  })
  
  if (error) throw error
  return data
}

/**
 * Sign in with email and password
 * This is a fallback method if magic links are not preferred
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) throw error
  return data
}

export async function signOut() {
  // Clear any old localStorage sessions
  if (typeof window !== 'undefined') {
    localStorage.clear()
  }
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function forceReauth() {
  // Force sign out and clear all sessions
  await signOut()
  // Clear admin cache
  adminUserCache.clear()
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    // Get session first - quick check if user is logged in
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      // Check if there's an old localStorage session that needs migration
      if (typeof window !== 'undefined') {
        const oldSession = localStorage.getItem('sb-' + process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0] + '-auth-token')
        if (oldSession) {
          console.log('Found old localStorage session, please sign in again to migrate to cookies')
          localStorage.clear() // Clear old sessions
        }
      }
      return null
    }
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    
    // Check cache first for admin status
    if (adminUserCache.has(user.id)) {
      const isAdmin = adminUserCache.get(user.id)
      return {
        id: user.id,
        email: user.email || '',
        username: user.user_metadata?.username,
        isAdmin: !!isAdmin
      }
    }
    
    // If not in cache, check database
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()
    
    // Handle potential database errors gracefully
    if (adminError) {
      console.error('Error checking admin status:', adminError)
      // Default to non-admin on error to be safe
      adminUserCache.set(user.id, false)
      return {
        id: user.id,
        email: user.email || '',
        username: user.user_metadata?.username,
        isAdmin: false
      }
    }
    
    // User is admin if they exist in the admin_users table
    const isAdmin = !!adminData
    
    // Cache the result
    adminUserCache.set(user.id, isAdmin)
    
    return {
      id: user.id,
      email: user.email || '',
      username: user.user_metadata?.username,
      isAdmin
    }
  } catch (error) {
    console.error('Error in getCurrentUser:', error)
    return null
  }
}

export function subscribeToAuthChanges(callback: (user: AuthUser | null) => void) {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      // Check cache first for admin status
      if (adminUserCache.has(session.user.id)) {
        const isAdmin = adminUserCache.get(session.user.id)
        callback({
          id: session.user.id,
          email: session.user.email || '',
          username: session.user.user_metadata?.username,
          isAdmin: !!isAdmin
        })
        return
      }
      
      // If not in cache, check database
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', session.user.id)
        .maybeSingle()
      
      // Handle potential database errors gracefully
      if (adminError) {
        console.error('Error checking admin status:', adminError)
        // Default to non-admin on error to be safe
        adminUserCache.set(session.user.id, false)
        callback({
          id: session.user.id,
          email: session.user.email || '',
          username: session.user.user_metadata?.username,
          isAdmin: false
        })
        return
      }
      
      // User is admin if they exist in the admin_users table
      const isAdmin = !!adminData
      
      // Cache the result
      adminUserCache.set(session.user.id, isAdmin)
      
      callback({
        id: session.user.id,
        email: session.user.email || '',
        username: session.user.user_metadata?.username,
        isAdmin
      })
    } else if (event === 'SIGNED_OUT') {
      // Clear cache on sign out
      if (session?.user?.id) {
        adminUserCache.delete(session.user.id)
      }
      callback(null)
    }
  })
}
