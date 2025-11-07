import { supabase } from "@/lib/supabase"

export class AuthService {
  /**
   * Sign in with magic link email
   */
  static async signInWithMagicLink(email: string): Promise<{ error: any | null }> {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/ctroom`,
        },
      })
      
      return { error }
    } catch (error) {
      console.error('Error in signInWithMagicLink:', error)
      return { error }
    }
  }

  /**
   * Get current user session
   */
  static async getCurrentUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        return { user: null, error: null }
      }
      
      const { data: { user } } = await supabase.auth.getUser()
      
      // Check if user is admin
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', user?.email)
        .single()
      
      const isAdmin = !!adminData
      
      return { 
        user: user ? {
          id: user.id,
          email: user.email || '',
          username: user.user_metadata?.username || '',
          isAdmin
        } : null, 
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
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (error) {
      console.error('Error in signOut:', error)
      return { error }
    }
  }
}
