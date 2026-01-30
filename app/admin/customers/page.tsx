"use client"

import { useState, useEffect } from "react"
import { Search, Eye, User as UserIcon, Mail, Phone, Calendar, ShoppingBag, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { API_BASE_URL } from "@/lib/config"
import { CardSkeleton } from "@/components/ui/skeletons"

interface BookingHistory {
  bookingId: string
  packageName: string
  totalGuests: number
  totalAmount: number
  tripDate: string
  status: string
  createdAt: string
}

interface User {
  _id: string
  name: string
  email: string
  phone: string
  status: string
  createdAt: string
  updatedAt: string
  lastLogin?: string
  totalBookings: number
  totalSpent: number
  bookingHistory: BookingHistory[]
}

interface ApiResponse {
  status: boolean
  message: string
  data: User[]
}

export default function CustomersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/admin/user/getUser`)
      const result: ApiResponse = await response.json()
      
      if (result.status) {
        setUsers(result.data)
        toast({
          title: "Success",
          description: result.message,
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const month = months[date.getMonth()]
    const year = date.getFullYear()
    return `${day} ${month} ${year}`
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || user.status.toLowerCase() === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  const handleViewDetails = (user: User) => {
    setSelectedUser(user)
    setIsDetailsOpen(true)
  }


  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <CardSkeleton key={`user-skeleton-${index}`} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-balance">Customers Management</h1>
        <p className="text-muted-foreground">Manage registered customers and their accounts</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Account Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Name</th>
                  <th className="text-left p-4 font-medium">Contact</th>
                  <th className="text-left p-4 font-medium">Email</th>
                  <th className="text-left p-4 font-medium">Joining Date</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-right p-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="border-b hover:bg-muted/50">
                    <td className="p-4">
                      <div className="font-medium">{user.name}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">{user.phone}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">{user.email}</div>
                    </td>
                    <td className="p-4">{formatDate(user.createdAt)}</td>
                    <td className="p-4">
                      <Badge variant={user.status === "Active" ? "default" : "destructive"}>
                        {user.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end">
                        <Button variant="ghost" size="icon" onClick={() => handleViewDetails(user)} title="View Details">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>Complete information about this user and their booking history</DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              {/* User Information */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Name:</span>
                      <span className="text-sm font-semibold">{selectedUser.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Email:</span>
                      <span className="text-sm font-medium">{selectedUser.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Contact:</span>
                      <span className="text-sm font-medium">{selectedUser.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Joined Date:</span>
                      <span className="text-sm font-medium">{formatDate(selectedUser.createdAt)}</span>
                    </div>
                    {selectedUser.lastLogin && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Last Login:</span>
                        <span className="text-sm font-medium">{formatDate(selectedUser.lastLogin)}</span>
                      </div>
                    )}
                  </div>
                  <Badge variant={selectedUser.status === "Active" ? "default" : "destructive"} className="text-sm">
                    {selectedUser.status}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Statistics */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium flex items-center gap-2">
                      <ShoppingBag className="h-3 w-3 text-muted-foreground" />
                      Total Bookings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">{selectedUser.totalBookings}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium flex items-center gap-2">
                      <DollarSign className="h-3 w-3 text-muted-foreground" />
                      Total Spent
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">₹{selectedUser.totalSpent.toLocaleString()}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      Avg. per Booking
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">
                      ₹{selectedUser.totalBookings > 0 ? Math.round(selectedUser.totalSpent / selectedUser.totalBookings).toLocaleString() : 0}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              {/* Booking History */}
              <div>
                <h3 className="text-base font-semibold mb-3">Booking History</h3>
                {selectedUser.bookingHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2 text-xs font-medium">Booking ID</th>
                          <th className="text-left p-2 text-xs font-medium">Package</th>
                          <th className="text-left p-2 text-xs font-medium">Guests</th>
                          <th className="text-left p-2 text-xs font-medium">Trip Date</th>
                          <th className="text-left p-2 text-xs font-medium">Amount</th>
                          <th className="text-left p-2 text-xs font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedUser.bookingHistory.map((booking) => (
                          <tr key={booking.bookingId} className="border-b hover:bg-muted/50">
                            <td className="p-2 font-mono text-xs">
                              {booking.bookingId.slice(-8).toUpperCase()}
                            </td>
                            <td className="p-2 text-sm">{booking.packageName}</td>
                            <td className="p-2 text-sm">{booking.totalGuests}</td>
                            <td className="p-2 text-sm">{formatDate(booking.tripDate)}</td>
                            <td className="p-2 text-sm font-medium">₹{booking.totalAmount.toLocaleString()}</td>
                            <td className="p-2">
                              <Badge
                                variant={
                                  booking.status === "Active"
                                    ? "default"
                                    : booking.status === "Pending"
                                      ? "secondary"
                                      : "destructive"
                                }
                              >
                                {booking.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No bookings found for this user</div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}