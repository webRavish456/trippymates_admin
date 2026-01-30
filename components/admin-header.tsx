"use client"

import { useState } from "react"
import { Search, LogOut, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"
import { NotificationDropdown } from "@/components/notification-dropdown"

export function AdminHeader() {
  const { user, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  console.log("dropdownOpen", dropdownOpen)

  console.log("user", user)

  const handleDropdownOpen = () => {
    setDropdownOpen(!dropdownOpen)
  }

  const adminToken = typeof window !== 'undefined' ? (localStorage.getItem('adminToken') || localStorage.getItem('token')) : null

  return (
    <header className="flex h-16 items-center justify-end gap-4 border-b bg-background px-6">
      {/* Actions */}
      <div className="flex items-center gap-4">
        {adminToken && (
          <NotificationDropdown adminToken={adminToken} adminId={user?.id || ''} />
        )}

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger >
            <Button 
              variant="ghost" 
              className="flex items-center gap-2 px-2 hover:bg-accent cursor-pointer"
              onClick={handleDropdownOpen}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user?.name?.charAt(0)?.toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">
                {user?.role 
                  ? String(user.role).split(" ").map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                    ).join(" ")
                  : "Admin"}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
{     dropdownOpen && (
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.name || "Admin User"}</p>
                <p className="text-xs text-muted-foreground">{user?.email || "superadmin@gmail.com"}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        )}
        </DropdownMenu>
      </div>
    </header>
  )
}
