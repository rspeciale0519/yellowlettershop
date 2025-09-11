"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface AuthState {
  user: SupabaseUser | null
  isLoading: boolean
  isAuthenticated: boolean
}

export function useAuth() {
  const supabase = createClient()
  const router = useRouter()
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  })

  // Check for existing Supabase session
  const checkSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.getUser()
      
      // Handle specific "Auth session missing" case silently
      if (error && error.message === 'Auth session missing!') {
        setAuthState({ user: null, isLoading: false, isAuthenticated: false })
        return
      }
      
      if (error) throw error
      const user = data.user ?? null
      setAuthState({
        user,
        isLoading: false,
        isAuthenticated: !!user,
      })
    } catch (error) {
      // Only log unexpected errors, not missing session
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage !== 'Auth session missing!') {
        console.error("Error checking Supabase session:", error)
      }
      setAuthState({ user: null, isLoading: false, isAuthenticated: false })
    }
  }, [supabase])

  // Login with email/password helper (optional)
  const loginWithPassword = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      setAuthState({ user: data.user, isLoading: false, isAuthenticated: true })
      
      // Redirect to dashboard after successful login
      router.push('/dashboard')
      
      return data
    },
    [supabase, router]
  )

  // Logout via Supabase
  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setAuthState({ user: null, isLoading: false, isAuthenticated: false })
  }, [supabase])

  // Initialize auth state and subscribe to changes
  useEffect(() => {
    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user ?? null
      setAuthState({ user: u, isLoading: false, isAuthenticated: !!u })
      
      // Note: Redirect logic removed from here to prevent conflicts
      // Auth flow redirects are now handled only by the Header component
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [checkSession, supabase, router])

  return {
    ...authState,
    loginWithPassword,
    logout,
    checkSession,
  }
}
