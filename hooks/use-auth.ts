"use client"

import { useState, useEffect, useCallback } from "react"

interface User {
  id: string
  email: string
  name: string
  avatar?: string
  loginMethod: "email" | "google"
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  })

  // Check for existing user session
  const checkSession = useCallback(() => {
    try {
      const storedUser = localStorage.getItem("yls_user") || sessionStorage.getItem("yls_user")
      if (storedUser) {
        const user = JSON.parse(storedUser)
        setAuthState({
          user,
          isLoading: false,
          isAuthenticated: true,
        })
      } else {
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        })
      }
    } catch (error) {
      console.error("Error checking user session:", error)
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      })
    }
  }, [])

  // Login function
  const login = useCallback((user: User, rememberMe = false) => {
    const storage = rememberMe ? localStorage : sessionStorage
    storage.setItem("yls_user", JSON.stringify(user))
    setAuthState({
      user,
      isLoading: false,
      isAuthenticated: true,
    })
  }, [])

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem("yls_user")
    sessionStorage.removeItem("yls_user")
    setAuthState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    })
  }, [])

  // Initialize auth state on mount
  useEffect(() => {
    checkSession()
  }, [checkSession])

  // Listen for storage changes (for multi-tab support)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "yls_user") {
        checkSession()
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [checkSession])

  return {
    ...authState,
    login,
    logout,
    checkSession,
  }
}
