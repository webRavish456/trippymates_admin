"use client"

import Link from "next/link"
import NextImage from "next/image"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  LayoutDashboard,
  Users,
  Map,
  Calendar,
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
  Shield,
  Award,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

import { useSelector } from "react-redux"
import { RootState } from "@/components/redux/store"



type SubItem = {
  name: string
  href: string
  module: string
}

type NavItem = {
  name: string
  href?: string
  icon: any
  module?: string
  subItems?: SubItem[]
}

/* ---------------- NAVIGATION ---------------- */

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard, module: "dashboard" },

  {
    name: "Captains",
    icon: UserCheck,
    subItems: [
      { name: "Captain Details", href: "/admin/captain/details", module: "captain_details" },
      { name: "Captain Assignment", href: "/admin/captain/assignment", module: "captain_assignment" },
    ],
  },

  { name: "Users", href: "/admin/users", icon: Users, module: "users" },
  { name: "Customers", href: "/admin/customers", icon: Users, module: "customers" },
  { name: "Vendors", href: "/admin/vendors", icon: Users, module: "vendors" },
  { name: "Roles & Permissions", href: "/admin/roles-permissions", icon: Shield, module: "roles_permissions" },
  { name: "Explore Destination", href: "/admin/explore-destination", icon: MapPin, module: "explore_destination" },
  { name: "Community Trips", href: "/admin/community-trips", icon: UsersRound, module: "community_trips" },
  { name: "Packages", href: "/admin/packages", icon: Box, module: "packages" },
  { name: "Bookings", href: "/admin/bookings", icon: Calendar, module: "bookings" },
  { name: "Trips", href: "/admin/trips", icon: Map, module: "trips" },
  { name: "Payments", href: "/admin/payments", icon: CreditCard, module: "payments" },
  { name: "Banner", href: "/admin/banner", icon: Image, module: "banner" },

  {
    name: "Coupon Code",
    icon: Ticket,
    subItems: [
      { name: "Coupon Details", href: "/admin/coupon-code/details", module: "coupon_details" },
      { name: "Coupon Management", href: "/admin/coupon-code/management", module: "coupon_management" },
    ],
  },

  {
    name: "Promo Code",
    icon: Gift,
    subItems: [
      { name: "Promo Details", href: "/admin/promo-code/details", module: "promo_details" },
      { name: "Promo Management", href: "/admin/promo-code/management", module: "promo_management" },
    ],
  },

  { name: "Reward Code", href: "/admin/reward-code/management", icon: Award, module: "reward_management" },

  {
    name: "Content",
    icon: FileText,
    href: "/admin/content?tab=blog",
    module: "content"
  },

  { name: "Notifications", href: "/admin/notifications", icon: Bell, module: "notifications" },


  {
    name: "Report",
    icon: BarChart3,
    href: "/admin/reports?tab=income",
    module: "report"
  },

  { name: "Settings", href: "/admin/settings", icon: Settings, module: "settings" },
]

/* ---------------- COMPONENT ---------------- */

export function AdminSidebar() {
  const pathname = usePathname()
  const [openMenus, setOpenMenus] = useState<string[]>([])


  const permissions = useSelector(
    (state: RootState) => state.permission.permissions
  )

  const canRead = (module?: string) => {
    if (module === "dashboard") return true
    return permissions.find((p) => p.module === module)?.read ?? false
  }

  const filteredNavigation = navigation
    .map((item) => {
      if (item.subItems) {
        const subs = item.subItems.filter((s) => canRead(s.module))
        return subs.length ? { ...item, subItems: subs } : null
      }
      return canRead(item.module) ? item : null
    })
    .filter(Boolean) as NavItem[]

  const toggleMenu = (name: string) => {
    setOpenMenus((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    )
  }

  const isSubActive = (subs?: SubItem[]) =>
    subs?.some((s) => s.href === pathname)

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-sidebar">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <NextImage src="/logo.png" alt="Logo" width={120} height={40} className="object-contain" />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {filteredNavigation.map((item) => {
          const open = openMenus.includes(item.name)
          const subActive = isSubActive(item.subItems)

          if (item.subItems) {
            return (
              <Collapsible
                key={item.name}
                open={open}
                onOpenChange={() => toggleMenu(item.name)}
              >
                <CollapsibleTrigger asChild>
                  <button
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium",
                      open || subActive
                        ? "bg-sidebar-accent"
                        : "hover:bg-sidebar-accent"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </div>
                    {open ? <ChevronDown /> : <ChevronRight />}
                  </button>
                </CollapsibleTrigger>

                <CollapsibleContent className="mt-1 space-y-1 pl-6">
                  {item.subItems.map((sub) => (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      className={cn(
                        "block rounded-lg px-3 py-2 text-sm",
                        pathname === sub.href
                          ? "bg-sidebar-accent"
                          : "hover:bg-sidebar-accent"
                      )}
                    >
                      {sub.name}
                    </Link>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )
          }

          return (
            <Link
              key={item.name}
              href={item.href!}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                pathname === item.href
                  ? "bg-sidebar-accent"
                  : "hover:bg-sidebar-accent"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
