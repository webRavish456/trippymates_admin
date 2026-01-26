"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Map } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { API_BASE_URL } from "@/lib/config"
import { useDispatch } from "react-redux"
import { setPermissions } from "@/components/redux/action"
export default function LoginPage() {

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const dispatch = useDispatch()

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/adminLogin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await res.json()
      
      console.log("API Response:", data)


      if (data?.status === "true" && data?.Token) {

        const adminData = data?.data?.admin || {}
        const roleName = adminData.roleName || "Admin"
        const userName = adminData.name || email.split('@')[0]
        
   

        dispatch(setPermissions(adminData.permissions))
   
        const userData = {
          token: data.Token,
          user: { 
            id: adminData._id,
            email: adminData.email || email,
            name: userName,
            role: roleName 
          }
        }
        
        await login(userData)
        
        toast({
          title: "Login successful",
          description: `Welcome back, ${email}!`,
        })
        

        setTimeout(() => {
          router.push("/admin")
        }, 100)
      } else {
        const msg = String(data?.message || "")
        const isEmailNotFound =
          msg.toLowerCase().includes("not found") || msg.toLowerCase().includes("record with this email")

        toast({
          title: isEmailNotFound ? "Invalid Email" : "Login failed",
          description: isEmailNotFound ? "Please check your email" : (data?.message || "Invalid credentials"),
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Error",
        description: "Unable to connect to server. Please check if backend is running.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
              <Map className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Travel Admin Panel</CardTitle>
          <CardDescription>Sign in to manage your travel booking platform</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@travel.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}