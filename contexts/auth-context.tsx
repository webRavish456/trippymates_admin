"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"

export type UserRole = "super_admin" | "content_manager" | "customer_support" | "admin"

export interface User {
  id?: string
  email: string
  name: string
  role: UserRole
  avatar?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (data: { token: string; user: User }) => Promise<void>
  logout: () => void
  isLoading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Load user from localStorage on mount - ONLY ONCE
  useEffect(() => {
    // Prevent multiple loads
    if (hasLoaded) return

    try {
      // Check both 'token' and 'adminToken' for compatibility
      const storedToken = localStorage.getItem("token") || localStorage.getItem("adminToken")
      const storedUser = localStorage.getItem("user")

      if (storedToken && storedUser) {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
        // Also save as adminToken for backward compatibility
        if (!localStorage.getItem("adminToken")) {
          localStorage.setItem("adminToken", storedToken)
        }
      }
    } catch (error) {
      console.error("Error loading auth data:", error)
    } finally {
      setIsLoading(false)
      setHasLoaded(true)
    }
  }, [hasLoaded])

  // Redirect to login if not authenticated on protected routes - ONLY check once after loading
  useEffect(() => {
    // Only redirect after initial load is complete
    if (!hasLoaded || isLoading) return
    
    if (!user && pathname?.startsWith("/admin") && pathname !== "/login") {
      router.push("/login")
    }
  }, [hasLoaded, isLoading, user, pathname, router])

  const login = async (data: { token: string; user: User }) => {
    try {
      console.log("Login called with:", data)
      
      setToken(data.token)
      setUser(data.user)
      
      // Save to localStorage - save in both 'token' and 'adminToken' for compatibility
      localStorage.setItem("token", data.token)
      localStorage.setItem("adminToken", data.token) // Also save as adminToken
      localStorage.setItem("user", JSON.stringify(data.user))
      
      console.log("User and token saved to localStorage")
      
      // Small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 100))
      
    } catch (error) {
      console.error("Error during login:", error)
      throw error
    }
  }

  const logout = () => {
    console.log("Logging out...")
    setUser(null)
    setToken(null)
    // Remove both token and adminToken
    localStorage.removeItem("token")
    localStorage.removeItem("adminToken")
    localStorage.removeItem("user")
    setHasLoaded(false) // Reset loaded state
    router.push("/login")
  }

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        token, 
        login, 
        logout, 
        isLoading,
        isAuthenticated: !!user && !!token
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}