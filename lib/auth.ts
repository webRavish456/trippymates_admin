// Authentication and role management utilities

export type UserRole = "super_admin" | "content_manager" | "customer_support" | "admin"

export interface User {
  id?: string
  email: string
  name: string
  role: UserRole
  avatar?: string
}

export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    super_admin: 4,
    admin: 3,
    content_manager: 2,
    customer_support: 1,
  }

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}


import { API_BASE_URL } from './config'

// API login function
export async function loginWithAPI(email: string, password: string): Promise<{ user: User; token: string } | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/adminLogin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json()

    if (data?.status === "true" && data?.Token) {
      return {
        token: data.Token,
        user: {
          email,
          name: email.split('@')[0], // Extract name from email
          role: "admin",
        }
      }
    }
    
    return null
  } catch (error) {
    console.error("Login API error:", error)
    return null
  }
}