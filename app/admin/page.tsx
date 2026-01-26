"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Users, MapPin, Building2, UserCheck, ShoppingCart, Tag, Gift, FileText, BookOpen } from "lucide-react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Cell } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { API_BASE_URL } from "@/lib/config"
import { CardSkeleton } from "@/components/ui/skeletons"

const revenueData = [
  { month: "Jan", revenue: 45000 },
  { month: "Feb", revenue: 52000 },
  { month: "Mar", revenue: 48000 },
  { month: "Apr", revenue: 61000 },
  { month: "May", revenue: 55000 },
  { month: "Jun", revenue: 67000 },
]

const bookingsData = [
  { month: "Jan", bookings: 45 },
  { month: "Feb", bookings: 52 },
  { month: "Mar", bookings: 48 },
  { month: "Apr", bookings: 61 },
  { month: "May", bookings: 55 },
  { month: "Jun", bookings: 67 },
]

interface DashboardStats {
  // Top Summary Cards
  totalUsers: number
  totalCaptains: number
  totalVendors: number
  totalPackages: number
  totalBookings: number
  activeTrips: number
  totalRevenue: number
  pendingPayments: number
  
  // Today / This Month Stats
  todayBookings: number
  todayRevenue: number
  todayCancelled: number
  newUsersToday: number
  newUsersThisWeek: number
  newCaptainsJoined: number
  
  // Captains Overview
  activeCaptains: number
  pendingApprovalCaptains: number
  rejectedCaptains: number
  topRatedCaptains: number
  captainsWithComplaints: number
  
  // Trips Overview
  ongoingTrips: number
  upcomingTrips: number
  completedTrips: number
  cancelledTrips: number
  tripsWithCaptain: number
  tripsWithoutCaptain: number
  
  // Offers & Promotions
  activeCouponCodes: number
  activePromoCodes: number
  couponUsageCount: number
  totalDiscountGiven: number
  
  // General
  totalIncome: number
  totalExpenses: number
  loading: boolean
}

interface PopularDestination {
  name: string
  bookings: number
}

interface CaptainPerformance {
  name: string
  bookings: number
  rating: number
}

interface VendorPerformance {
  name: string
  bookings: number
  revenue: number
}

interface RecentActivity {
  type: string
  user: string
  package: string
  amount: number
  status: string
  date: string
}

interface PaymentStatusData {
  paid: number
  pending: number
  failed: number
}

interface BookingTrend {
  date: string
  bookings: number
}

interface CancellationData {
  date: string
  cancelled: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    // Top Summary Cards
    totalUsers: 0,
    totalCaptains: 0,
    totalVendors: 0,
    totalPackages: 0,
    totalBookings: 0,
    activeTrips: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    
    // Today / This Month Stats
    todayBookings: 0,
    todayRevenue: 0,
    todayCancelled: 0,
    newUsersToday: 0,
    newUsersThisWeek: 0,
    newCaptainsJoined: 0,
    
    // Captains Overview
    activeCaptains: 0,
    pendingApprovalCaptains: 0,
    rejectedCaptains: 0,
    topRatedCaptains: 0,
    captainsWithComplaints: 0,
    
    // Trips Overview
    ongoingTrips: 0,
    upcomingTrips: 0,
    completedTrips: 0,
    cancelledTrips: 0,
    tripsWithCaptain: 0,
    tripsWithoutCaptain: 0,
    
    // Offers & Promotions
    activeCouponCodes: 0,
    activePromoCodes: 0,
    couponUsageCount: 0,
    totalDiscountGiven: 0,
    
    // General
    totalIncome: 0,
    totalExpenses: 0,
    loading: true,
  })

  const [popularDestinations, setPopularDestinations] = useState<PopularDestination[]>([])
  const [topCaptains, setTopCaptains] = useState<CaptainPerformance[]>([])
  const [topVendors, setTopVendors] = useState<VendorPerformance[]>([])
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusData>({ paid: 0, pending: 0, failed: 0 })
  const [bookingTrend, setBookingTrend] = useState<BookingTrend[]>([])
  const [chartsLoading, setChartsLoading] = useState(true)
  const [contentStats, setContentStats] = useState({
    totalBlogs: 0,
    totalArticles: 0,
    totalTestimonials: 0,
    totalFAQs: 0,
    loading: true,
  })

  useEffect(() => {
    fetchDashboardStats()
    fetchChartsData()
  }, [])

  const fetchChartsData = async () => {
    try {
      setChartsLoading(true)
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token')
      
      // Fetch all data in parallel
      const [bookingsRes, captainsRes, vendorsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/booking/getBooking`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null),
        fetch(`${API_BASE_URL}/api/admin/captain/all?limit=100`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null),
        fetch(`${API_BASE_URL}/api/admin/vendor/all?limit=100`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null),
      ])

      // Parse bookings data once
      let bookingsData: any = null
      if (bookingsRes?.ok) {
        bookingsData = await bookingsRes.json()
      }

      // Process Popular Destinations from Bookings
      if (bookingsData?.status && Array.isArray(bookingsData.data)) {
        const destinationMap = new Map<string, number>()
        
        bookingsData.data.forEach((booking: any) => {
          const packageName = booking.packageName || booking.packageDetails?.title || 'Unknown'
          destinationMap.set(packageName, (destinationMap.get(packageName) || 0) + 1)
        })
        
        const destinations = Array.from(destinationMap.entries())
          .map(([name, bookings]) => ({ name, bookings }))
          .sort((a, b) => b.bookings - a.bookings)
          .slice(0, 10) // Top 10 popular destinations
        
        setPopularDestinations(destinations)
      }

      // Process Top 5 Captains Performance
      if (captainsRes?.ok) {
        const captainsData = await captainsRes.json()
        if (captainsData.status && captainsData.data?.captains) {
          const captains = captainsData.data.captains
          
          // Count bookings per captain
          if (bookingsData?.status && Array.isArray(bookingsData.data)) {
            const captainBookingsMap = new Map<string, number>()
            
            bookingsData.data.forEach((booking: any) => {
              if (booking.captainId || booking.assignedCaptain?._id) {
                const captainId = booking.captainId || booking.assignedCaptain?._id
                captainBookingsMap.set(captainId, (captainBookingsMap.get(captainId) || 0) + 1)
              }
            })
            
            const captainPerformance = captains
              .map((captain: any) => ({
                name: captain.name,
                bookings: captainBookingsMap.get(captain._id) || 0,
                rating: captain.rating || 0,
              }))
              .sort((a: CaptainPerformance, b: CaptainPerformance) => {
                // Sort by bookings first, then by rating
                if (b.bookings !== a.bookings) {
                  return b.bookings - a.bookings
                }
                return b.rating - a.rating
              })
              .slice(0, 5) // Top 5 captains
            
            setTopCaptains(captainPerformance)
          } else {
            // If no bookings data, just use captains with ratings
            const captainPerformance = captains
              .map((captain: any) => ({
                name: captain.name,
                bookings: 0,
                rating: captain.rating || 0,
              }))
              .sort((a: CaptainPerformance, b: CaptainPerformance) => b.rating - a.rating)
              .slice(0, 5)
            
            setTopCaptains(captainPerformance)
          }
        }
      }

      // Process Top 5 Vendors Performance
      if (vendorsRes?.ok) {
        const vendorsData = await vendorsRes.json()
        if (vendorsData.status && vendorsData.data?.vendors) {
          const vendors = vendorsData.data.vendors
          
          // Count bookings and revenue per vendor
          if (bookingsData?.status && Array.isArray(bookingsData.data)) {
            const vendorBookingsMap = new Map<string, { bookings: number; revenue: number }>()
            
            bookingsData.data.forEach((booking: any) => {
              // Assuming vendorId might be in booking or packageDetails
              const vendorId = booking.vendorId || booking.packageDetails?.vendorId
              if (vendorId) {
                const current = vendorBookingsMap.get(vendorId) || { bookings: 0, revenue: 0 }
                vendorBookingsMap.set(vendorId, {
                  bookings: current.bookings + 1,
                  revenue: current.revenue + (booking.totalAmount || booking.finalAmount || 0),
                })
              }
            })
            
            const vendorPerformance = vendors
              .map((vendor: any) => {
                const stats = vendorBookingsMap.get(vendor._id) || { bookings: 0, revenue: 0 }
                return {
                  name: vendor.name,
                  bookings: stats.bookings,
                  revenue: stats.revenue,
                }
              })
              .sort((a: VendorPerformance, b: VendorPerformance) => {
                // Sort by revenue first, then by bookings
                if (b.revenue !== a.revenue) {
                  return b.revenue - a.revenue
                }
                return b.bookings - a.bookings
              })
              .slice(0, 5) // Top 5 vendors
            
            setTopVendors(vendorPerformance)
          } else {
            // If no bookings data, just show vendors with 0 stats
            const vendorPerformance = vendors
              .slice(0, 5)
              .map((vendor: any) => ({
                name: vendor.name,
                bookings: 0,
                revenue: 0,
              }))
            
            setTopVendors(vendorPerformance)
          }
        }
      }
    } catch (error) {
      console.error("Error fetching charts data:", error)
    } finally {
      setChartsLoading(false)
    }
  }

  const fetchDashboardStats = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true }))
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token')
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      
      // Fetch all data in parallel
      const [
        bookingsRes, tripsRes, incomeRes, expenseRes,
        usersRes, captainsRes, vendorsRes, packagesRes, couponsRes, promosRes,
        blogsRes, articlesRes, testimonialsRes, faqsRes
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/booking/getBooking`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null),
        fetch(`${API_BASE_URL}/api/admin/trip/active-trips`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null),
        fetch(`${API_BASE_URL}/api/admin/reports/income?dateRange=all`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null),
        fetch(`${API_BASE_URL}/api/admin/reports/expense?dateRange=all`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null),
        fetch(`${API_BASE_URL}/api/admin/user/all`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null),
        fetch(`${API_BASE_URL}/api/admin/captain/all?limit=1000`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null),
        fetch(`${API_BASE_URL}/api/admin/vendor/all?limit=1000`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null),
        fetch(`${API_BASE_URL}/api/admin/package/all?limit=1000`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null),
        fetch(`${API_BASE_URL}/api/admin/coupon/all`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null),
        fetch(`${API_BASE_URL}/api/admin/promo/all`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null),
        fetch(`${API_BASE_URL}/api/admin/blog/all?sectionType=main`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null),
        fetch(`${API_BASE_URL}/api/admin/blog/all?sectionType=article`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null),
        fetch(`${API_BASE_URL}/api/admin/testimonial/all`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null),
        fetch(`${API_BASE_URL}/api/admin/faq/all`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null),
      ])

      // Initialize all stats
      let statsData: DashboardStats = {
        totalUsers: 0,
        totalCaptains: 0,
        totalVendors: 0,
        totalPackages: 0,
        totalBookings: 0,
        activeTrips: 0,
        totalRevenue: 0,
        pendingPayments: 0,
        todayBookings: 0,
        todayRevenue: 0,
        todayCancelled: 0,
        newUsersToday: 0,
        newUsersThisWeek: 0,
        newCaptainsJoined: 0,
        activeCaptains: 0,
        pendingApprovalCaptains: 0,
        rejectedCaptains: 0,
        topRatedCaptains: 0,
        captainsWithComplaints: 0,
        ongoingTrips: 0,
        upcomingTrips: 0,
        completedTrips: 0,
        cancelledTrips: 0,
        tripsWithCaptain: 0,
        tripsWithoutCaptain: 0,
        activeCouponCodes: 0,
        activePromoCodes: 0,
        couponUsageCount: 0,
        totalDiscountGiven: 0,
        totalIncome: 0,
        totalExpenses: 0,
        loading: false,
      }

      // Process Users
      if (usersRes?.ok) {
        const usersData = await usersRes.json()
        if (usersData.status && Array.isArray(usersData.data)) {
          statsData.totalUsers = usersData.data.length
          statsData.newUsersToday = usersData.data.filter((u: any) => {
            const created = new Date(u.createdAt)
            return created >= today
          }).length
          statsData.newUsersThisWeek = usersData.data.filter((u: any) => {
            const created = new Date(u.createdAt)
            return created >= weekAgo
          }).length
        }
      }

      // Process Captains
      if (captainsRes?.ok) {
        const captainsData = await captainsRes.json()
        if (captainsData.status && captainsData.data?.captains) {
          const captains = captainsData.data.captains
          statsData.totalCaptains = captains.length
          statsData.activeCaptains = captains.filter((c: any) => c.status === 'active').length
          statsData.pendingApprovalCaptains = captains.filter((c: any) => c.status === 'pending' || c.status === 'inactive').length
          statsData.rejectedCaptains = captains.filter((c: any) => c.status === 'rejected' || c.status === 'blocked').length
          statsData.topRatedCaptains = captains.filter((c: any) => (c.rating || 0) >= 4.5).length
          statsData.newCaptainsJoined = captains.filter((c: any) => {
            const created = new Date(c.createdAt)
            return created >= weekAgo
          }).length
        }
      }

      // Process Vendors
      if (vendorsRes?.ok) {
        const vendorsData = await vendorsRes.json()
        if (vendorsData.status && vendorsData.data?.vendors) {
          statsData.totalVendors = vendorsData.data.vendors.length
        }
      }

      // Process Packages
      if (packagesRes?.ok) {
        const packagesData = await packagesRes.json()
        if (packagesData.status && packagesData.data?.packages) {
          statsData.totalPackages = packagesData.data.packages.length
        } else if (packagesData.status && Array.isArray(packagesData.data)) {
          statsData.totalPackages = packagesData.data.length
        }
      }

      // Process Bookings
      if (bookingsRes?.ok) {
        const bookingsData = await bookingsRes.json()
        if (bookingsData.status && Array.isArray(bookingsData.data)) {
          const bookings = bookingsData.data
          statsData.totalBookings = bookings.length
          
          // Today's stats
          statsData.todayBookings = bookings.filter((b: any) => {
            const created = new Date(b.createdAt)
            return created >= today
          }).length
          
          statsData.todayRevenue = bookings
            .filter((b: any) => {
              const created = new Date(b.createdAt)
              return created >= today
            })
            .reduce((sum: number, b: any) => sum + (b.totalAmount || b.finalAmount || 0), 0)
          
          statsData.todayCancelled = bookings.filter((b: any) => {
            const created = new Date(b.createdAt)
            return created >= today && (b.status === 'cancelled' || b.status === 'canceled')
          }).length
          
          // Payment status
          const paid = bookings.filter((b: any) => b.paymentStatus === 'paid' || b.paymentStatus === 'completed').length
          const pending = bookings.filter((b: any) => b.paymentStatus === 'pending' || !b.paymentStatus).length
          const failed = bookings.filter((b: any) => b.paymentStatus === 'failed').length
          setPaymentStatus({ paid, pending, failed })
          statsData.pendingPayments = pending
          
          // Recent activities (last 10)
          const recent = bookings
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 10)
            .map((b: any) => ({
              type: 'booking',
              user: b.userName || b.userEmail || 'Unknown',
              package: b.packageName || 'Unknown',
              amount: b.totalAmount || b.finalAmount || 0,
              status: b.status || 'pending',
              date: new Date(b.createdAt).toLocaleDateString(),
            }))
          setRecentActivities(recent)
          
          // Booking trend (last 7 days)
          const trendData: BookingTrend[] = []
          for (let i = 6; i >= 0; i--) {
            const date = new Date(today)
            date.setDate(date.getDate() - i)
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            const count = bookings.filter((b: any) => {
              const created = new Date(b.createdAt)
              return created.toDateString() === date.toDateString()
            }).length
            trendData.push({ date: dateStr, bookings: count })
          }
          setBookingTrend(trendData)
        }
      }

      // Process Trips
      if (tripsRes?.ok) {
        const tripsData = await tripsRes.json()
        if (tripsData.status && Array.isArray(tripsData.data)) {
          const trips = tripsData.data
          statsData.activeTrips = trips.length
          statsData.ongoingTrips = trips.filter((t: any) => {
            const tripDate = new Date(t.tripDate)
            return tripDate <= today && (t.status === 'active' || t.status === 'ongoing')
          }).length
          statsData.upcomingTrips = trips.filter((t: any) => {
            const tripDate = new Date(t.tripDate)
            return tripDate > today
          }).length
          statsData.tripsWithCaptain = trips.filter((t: any) => t.captainId || t.assignedCaptain).length
          statsData.tripsWithoutCaptain = trips.filter((t: any) => !t.captainId && !t.assignedCaptain).length
        }
      }

      // Process Coupons
      if (couponsRes?.ok) {
        const couponsData = await couponsRes.json()
        if (couponsData.status && Array.isArray(couponsData.data)) {
          const coupons = couponsData.data
          statsData.activeCouponCodes = coupons.filter((c: any) => c.status === 'active').length
          statsData.couponUsageCount = coupons.reduce((sum: number, c: any) => sum + (c.usedCount || 0), 0)
          statsData.totalDiscountGiven = coupons.reduce((sum: number, c: any) => {
            const discount = c.discountValue || 0
            const used = c.usedCount || 0
            return sum + (discount * used)
          }, 0)
        }
      }

      // Process Promo Codes
      if (promosRes?.ok) {
        const promosData = await promosRes.json()
        if (promosData.status && Array.isArray(promosData.data)) {
          const promos = promosData.data
          statsData.activePromoCodes = promos.filter((p: any) => p.status === 'active').length
        }
      }

      // Process Income & Expenses
      if (incomeRes?.ok) {
        const incomeData = await incomeRes.json()
        if (incomeData.success && Array.isArray(incomeData.data)) {
          statsData.totalIncome = incomeData.data.reduce((sum: number, item: any) => {
            return sum + (Number.parseFloat(item.amount) || 0)
          }, 0)
          statsData.totalRevenue = statsData.totalIncome
        }
      }

      if (expenseRes?.ok) {
        const expenseData = await expenseRes.json()
        if (expenseData.success && Array.isArray(expenseData.data)) {
          statsData.totalExpenses = expenseData.data.reduce((sum: number, item: any) => {
            return sum + (Number.parseFloat(item.amount) || 0)
          }, 0)
        }
      }

      // Process Content Stats
      let totalBlogs = 0
      let totalArticles = 0
      let totalTestimonials = 0
      let totalFAQs = 0

      if (blogsRes?.ok) {
        const blogsData = await blogsRes.json()
        if (blogsData.status && Array.isArray(blogsData.data)) {
          totalBlogs = blogsData.data.length
        }
      }

      if (articlesRes?.ok) {
        const articlesData = await articlesRes.json()
        if (articlesData.status && Array.isArray(articlesData.data)) {
          totalArticles = articlesData.data.length
        }
      }

      if (testimonialsRes?.ok) {
        const testimonialsData = await testimonialsRes.json()
        if (testimonialsData.status && Array.isArray(testimonialsData.data)) {
          totalTestimonials = testimonialsData.data.length
        }
      }

      if (faqsRes?.ok) {
        const faqsData = await faqsRes.json()
        if (faqsData.status && Array.isArray(faqsData.data)) {
          totalFAQs = faqsData.data.length
        }
      }

      setContentStats({
        totalBlogs,
        totalArticles,
        totalTestimonials,
        totalFAQs,
        loading: false,
      })

      setStats(statsData)
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
      setStats(prev => ({ ...prev, loading: false }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-balance">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
      </div>

      {/* 1. Top Summary Cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Overview</h2>
        {stats.loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <CardSkeleton key={`summary-skeleton-${index}`} />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">All registered users</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Captains</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCaptains}</div>
                <p className="text-xs text-muted-foreground">All captains</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalVendors}</div>
                <p className="text-xs text-muted-foreground">All vendors</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalBookings.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">All time bookings</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Trips</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeTrips}</div>
                <p className="text-xs text-muted-foreground">Ongoing trips</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">All time revenue</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No recent activities</div>
          ) : (
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={`activity-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.user}</p>
                    <p className="text-xs text-muted-foreground">{activity.package}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">₹{activity.amount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{activity.date}</p>
                  </div>
                  <div className="ml-4">
                    <span className={`text-xs px-2 py-1 rounded ${
                      activity.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      activity.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {activity.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Popular Destinations Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Destinations</CardTitle>
          </CardHeader>
          <CardContent>
            {chartsLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-muted-foreground">Loading chart data...</div>
              </div>
            ) : popularDestinations.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-muted-foreground">No booking data available</div>
              </div>
            ) : (
              <ChartContainer
                config={{
                  bookings: {
                    label: "Bookings",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={popularDestinations} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      className="text-xs"
                      width={120}
                      tick={{ fontSize: 10 }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="bookings" fill="var(--color-chart-1)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Top 5 Captains Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Top Captains Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {chartsLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-muted-foreground">Loading chart data...</div>
              </div>
            ) : topCaptains.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-muted-foreground">No captain data available</div>
              </div>
            ) : (
              <ChartContainer
                config={{
                  bookings: {
                    label: "Bookings",
                    color: "hsl(var(--chart-2))",
                  },
                  rating: {
                    label: "Rating",
                    color: "hsl(var(--chart-3))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topCaptains}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="name" 
                      className="text-xs"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="bookings" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Top 5 Vendors Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Top Vendors Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {chartsLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-muted-foreground">Loading chart data...</div>
              </div>
            ) : topVendors.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-muted-foreground">No vendor data available</div>
              </div>
            ) : (
              <ChartContainer
                config={{
                  revenue: {
                    label: "Revenue",
                    color: "hsl(var(--chart-4))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topVendors}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="name" 
                      className="text-xs"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis className="text-xs" />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value: any, name: string) => {
                        if (name === 'revenue') {
                          return [`₹${value.toLocaleString()}`, 'Revenue']
                        }
                        return [value, name]
                      }}
                    />
                    <Bar dataKey="revenue" fill="var(--color-chart-4)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Revenue Overview Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                revenue: {
                  label: "Revenue",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Booking Trend Chart (Last 7 Days) */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Trend (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {bookingTrend.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-muted-foreground">No booking data available</div>
              </div>
            ) : (
              <ChartContainer
                config={{
                  bookings: {
                    label: "Bookings",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bookingTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="bookings" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Payment Status Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentStatus.paid === 0 && paymentStatus.pending === 0 && paymentStatus.failed === 0 ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-muted-foreground">No payment data available</div>
              </div>
            ) : (
              <ChartContainer
                config={{
                  paid: {
                    label: "Paid",
                    color: "#22c55e",
                  },
                  pending: {
                    label: "Pending",
                    color: "#f59e0b",
                  },
                  failed: {
                    label: "Failed",
                    color: "#ef4444",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { status: 'Paid', count: paymentStatus.paid },
                    { status: 'Pending', count: paymentStatus.pending },
                    { status: 'Failed', count: paymentStatus.failed },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="status" className="text-xs" />
                    <YAxis className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {[
                        { status: 'Paid', count: paymentStatus.paid },
                        { status: 'Pending', count: paymentStatus.pending },
                        { status: 'Failed', count: paymentStatus.failed },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={
                          entry.status === 'Paid' ? '#22c55e' :
                          entry.status === 'Pending' ? '#f59e0b' : '#ef4444'
                        } />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Offers & Promotions & Content Module Cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Offers & Content</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Coupons</CardTitle>
              <Tag className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.activeCouponCodes}</div>
              <p className="text-xs text-muted-foreground">Active coupon codes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Promos</CardTitle>
              <Gift className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.activePromoCodes}</div>
              <p className="text-xs text-muted-foreground">Active promo codes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Blog Posts</CardTitle>
              <FileText className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{contentStats.totalBlogs}</div>
              <p className="text-xs text-muted-foreground">Total blog posts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Articles</CardTitle>
              <BookOpen className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{contentStats.totalArticles}</div>
              <p className="text-xs text-muted-foreground">Total articles</p>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  )
}
