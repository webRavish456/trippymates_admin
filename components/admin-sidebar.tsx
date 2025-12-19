"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  LayoutDashboard,
  Map,
  Calendar,
  Users,
  CreditCard,
  FileText,
  BarChart3,
  Settings,
  Box,
  MapPin,
  Ticket,
  Gift,
  ChevronDown,
  ChevronRight,
  UsersRound,
  Image,
  UserCheck,
  Bell,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { canAccessFeature } from "@/lib/auth"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface NavItem {
  name: string
  href?: string
  icon: any
  feature: string
  subItems?: { name: string; href: string }[]
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard, feature: "dashboard" },
  { 
    name: "Captains", 
    icon: UserCheck, 
    feature: "captain",
    subItems: [
      { name: "Captain Details", href: "/admin/captain/details" },
      { name: "Captain Assignment", href: "/admin/captain/assignment" }
    ]
  },
  { name: "Users", href: "/admin/users", icon: Users, feature: "users" },
  { name: "Vendors", href: "/admin/vendors", icon: Users, feature: "vendors" },
  { name: "Explore Destination", href: "/admin/explore-destination", icon: MapPin, feature: "explore_destination" },
  { name: "Community", href: "/admin/community-trips", icon: UsersRound, feature: "community_trips" },
  { name: "Packages", href: "/admin/packages", icon: Box, feature: "packages" },
  { name: "Booking", href: "/admin/bookings", icon: Calendar, feature: "bookings" },
  { name: "Trips", href: "/admin/trips", icon: Map, feature: "trips" },
  { name: "Payments", href: "/admin/payments", icon: CreditCard, feature: "payments" },
  { name: "Banner", href: "/admin/banner", icon: Image, feature: "banner" },
  { 
    name: "Coupon Code", 
    icon: Ticket, 
    feature: "coupon_code",
    subItems: [
      { name: "Coupon Details", href: "/admin/coupon-code/details" },
      { name: "Coupon Management", href: "/admin/coupon-code/management" }
    ]
  },
  { 
    name: "Promo Code", 
    icon: Gift, 
    feature: "promo_code",
    subItems: [
      { name: "Promo Code Details", href: "/admin/promo-code/details" },
      { name: "Promo Code Management", href: "/admin/promo-code/management" }
    ]
  },
  { name: "Content", href: "/admin/content", icon: FileText, feature: "content" },
  { name: "Notifications", href: "/admin/notifications", icon: Bell, feature: "notifications" },
  { name: "Reports", href: "/admin/reports", icon: BarChart3, feature: "reports" },
  { name: "Settings", href: "/admin/settings", icon: Settings, feature: "settings" },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [openMenus, setOpenMenus] = useState<string[]>([])

  const filteredNavigation = navigation.filter((item) => (user ? canAccessFeature(user.role, item.feature) : false))

  const toggleMenu = (menuName: string) => {
    setOpenMenus((prev) => 
      prev.includes(menuName) 
        ? prev.filter((name) => name !== menuName)
        : [...prev, menuName]
    )
  }

  const isSubItemActive = (subItems?: { name: string; href: string }[]) => {
    if (!subItems) return false
    return subItems.some((subItem) => pathname === subItem.href)
  }

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
        <Map className="h-6 w-6 text-sidebar-primary" />
        <span className="font-semibold text-lg text-sidebar-foreground">TravelAdmin</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href
          const hasSubItems = item.subItems && item.subItems.length > 0
          const isSubMenuOpen = openMenus.includes(item.name)
          const isSubMenuActive = isSubItemActive(item.subItems)

          if (hasSubItems) {
            return (
              <Collapsible
                key={item.name}
                open={isSubMenuOpen}
                onOpenChange={() => toggleMenu(item.name)}
              >
                <CollapsibleTrigger
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isSubMenuActive || isSubMenuOpen
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </div>
                  {isSubMenuOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-1 space-y-1 pl-6">
                  {item.subItems?.map((subItem) => {
                    const isSubActive = pathname === subItem.href
                    return (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          isSubActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        {subItem.name}
                      </Link>
                    )
                  })}
                </CollapsibleContent>
              </Collapsible>
            )
          }

          return (
            <Link
              key={item.name}
              href={item.href || "#"}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
