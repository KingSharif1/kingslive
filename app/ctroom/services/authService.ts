import { supabase } from "@/lib/supabase"

export class AuthService {
  /**
   * Subscribe to auth changes
   * @param callback Function to call when auth state changes
   */
  static subscribeToAuthChanges(callback: (user: any | null) => void) {
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // Get full user data including admin status
          const { user } = await this.getCurrentUser()
          callback(user)
        } else if (event === 'SIGNED_OUT') {
          callback(null)
        } else if (event === 'USER_UPDATED' && session?.user) {
          const { user } = await this.getCurrentUser()
          callback(user)
        }
      })
      return subscription
    } catch (error) {
      console.error('Error in subscribeToAuthChanges:', error)
      return null
    }
  }
  /**
   * Sign in with magic link email
   */
  static async signInWithMagicLink(email: string): Promise<{ error: any | null }> {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      
      return { error }
    } catch (error) {
      console.error('Error in signInWithMagicLink:', error)
      return { error }
    }
  }
  
  /**
   * Handle login process including admin verification
   */
  static async handleLogin(email: string): Promise<{ 
    success: boolean, 
    error: string | null, 
    magicLinkSent: boolean 
  }> {
    try {
      // Simple validation
      if (!email || !email.includes('@')) {
        return { 
          success: false, 
          error: 'Please enter a valid email address', 
          magicLinkSent: false 
        }
      }
      
      // Check if user is authorized admin via secure API
      const adminResponse = await fetch('/api/auth/verify-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      })
      
      const adminResult = await adminResponse.json()
      console.log('Admin users result:', adminResult)
      
      if (!adminResponse.ok) {
        return { 
          success: false, 
          error: adminResult.error || 'Error checking admin status', 
          magicLinkSent: false 
        }
      }
      
      if (!adminResult.isAdmin) {
        return { 
          success: false, 
          error: 'Access denied. Only admin users can login.', 
          magicLinkSent: false 
        }
      }
      
      // Send magic link
      const { error } = await this.signInWithMagicLink(email)
      
      if (error) {
        return { 
          success: false, 
          error: error.message, 
          magicLinkSent: false 
        }
      }
      
      return { 
        success: true, 
        error: null, 
        magicLinkSent: true 
      }
    } catch (error: any) {
      console.error('Login error:', error)
      return { 
        success: false, 
        error: error.message || 'An error occurred during login', 
        magicLinkSent: false 
      }
    }
  }

  /**
   * Get current user session
   */
  static async getCurrentUser() {
    try {
      // Use getUser() which validates the JWT with the server
      // This is more reliable than getSession() which only reads local storage
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        // Don't log auth session missing as error - it's expected when not logged in
        if (!userError.message?.includes('Auth session missing')) {
          console.error('User error:', userError)
        }
        return { user: null, error: null }
      }
      
      if (!user || !user.email) {
        return { user: null, error: null }
      }
      
      // Check if user is admin
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('email')
        .eq('email', user.email.toLowerCase())
        .maybeSingle()
      
      const isAdmin = !!adminData
      
      return { 
        user: {
          id: user.id,
          email: user.email || '',
          username: user.user_metadata?.username || '',
          isAdmin
        }, 
        error: null 
      }
    } catch (error) {
      console.error('Error in getCurrentUser:', error)
      return { user: null, error }
    }
  }

  /**
   * Verify if a user is an admin
   */
  static async verifyAdmin(email: string): Promise<{ isAdmin: boolean, error: any | null }> {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .single()
      
      return { isAdmin: !!data, error }
    } catch (error) {
      console.error('Error in verifyAdmin:', error)
      return { isAdmin: false, error }
    }
  }

  /**
   * Sign out current user
   */
  static async signOut(): Promise<{ error: any | null }> {
    try {
      // Clear any local storage items
      if (typeof window !== 'undefined') {
        // Clear any old localStorage sessions
        localStorage.removeItem('supabase.auth.token')
        // Also clear any other auth-related items
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase')) {
            localStorage.removeItem(key)
          }
        })
      }
      
      // Call server-side signout endpoint to properly clear cookies
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      // Also sign out from Supabase client-side
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Supabase signOut error:', error)
        return { error }
      }
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('API signOut error:', errorData)
        return { error: errorData.error }
      }
      
      console.log('Successfully signed out')
      
      // Force page reload to trigger auth check
      if (typeof window !== 'undefined') {
        window.location.href = '/ctroom'
      }
      
      return { error: null }
    } catch (error) {
      console.error('Error in signOut:', error)
      return { error }
    }
  }
}
