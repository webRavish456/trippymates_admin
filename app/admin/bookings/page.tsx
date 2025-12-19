"use client"

import { useState, useEffect } from "react"
import moment from "moment-timezone"
import axios from "axios"
import { Search, Eye, Calendar, User, MapPin, Users, UserCheck, CreditCard, Tag, Percent, DollarSign, Phone, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { API_BASE_URL } from "@/lib/config"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface GuestDetail {
  _id: string
  guestName?: string
  guestAge?: number
  guestGender?: string
  guestAddress?: string
}

interface Booking {
  _id: string
  packageName: string
  packageId?: string
  packageDetails?: any
  userName: string
  userEmail?: string
  userPhone?: string
  userAddress?: string
  userId?: string
  totalGuests: number
  totalAmount: number
  baseAmount?: number
  discountAmount?: number
  finalAmount?: number
  adultPrice?: number
  childPrice?: number
  infantPrice?: number
  guestDetails: GuestDetail[]
  status: string
  createdAt: string
  updatedAt?: string
  tripdate?: string
  captainId?: string
  assignedCaptain?: {
    _id: string
    name: string
    email: string
    phone?: string
  }
  couponCode?: {
    _id: string
    code: string
    title: string
    discountType: string
    discountValue: number
  } | null
  promoCode?: {
    _id: string
    code: string
    title: string
    discountType: string
    discountValue: number
  } | null
  paymentStatus?: string
  paymentId?: string
  orderId?: string
  paymentMethod?: string
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [captains, setCaptains] = useState<any[]>([])
  const [assigningCaptain, setAssigningCaptain] = useState(false)
  const [showCaptainSelect, setShowCaptainSelect] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('adminToken')
        const [bookingsResponse, captainsResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/admin/booking/getBooking`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          axios.get(`${API_BASE_URL}/api/admin/captain/all?limit=100`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ])
        
        if (bookingsResponse.data.status && bookingsResponse.data.data) {
          setBookings(bookingsResponse.data.data)
        }
        
        if (captainsResponse.data.status && captainsResponse.data.data) {
          setCaptains(captainsResponse.data.data.captains || [])
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to fetch data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [toast])

  const filteredBookings = bookings.filter((booking) => {
    const bookingId = booking._id.slice(-8).toUpperCase()
    const matchesSearch =
      bookingId.includes(searchQuery.toUpperCase()) ||
      booking.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.packageName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || booking.status.toLowerCase() === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  const handleViewDetails = async (booking: Booking) => {
    try {
      const token = localStorage.getItem('adminToken')
      // Fetch full booking details with captain info
      const response = await axios.get(`${API_BASE_URL}/api/admin/booking/${booking._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.data.status && response.data.data) {
        setSelectedBooking(response.data.data)
      } else {
        setSelectedBooking(booking)
      }
    } catch (error) {
      console.error("Error fetching booking details:", error)
      setSelectedBooking(booking)
    }
    setIsDetailsOpen(true)
  }

  const handleAssignCaptain = async (bookingId: string, captainId: string) => {
    if (!captainId || captainId === "") {
      // Show select dropdown for changing captain
      setShowCaptainSelect(true)
      return
    }

    try {
      setAssigningCaptain(true)
      const token = localStorage.getItem('adminToken')
      
      // First, get booking details to get packageId and dates
      const bookingResponse = await axios.get(`${API_BASE_URL}/api/admin/booking/${bookingId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!bookingResponse.data.status || !bookingResponse.data.data) {
        throw new Error("Failed to fetch booking details")
      }
      
      const booking = bookingResponse.data.data
      const packageId = booking.packageId?._id || booking.packageId
      
      if (!packageId) {
        throw new Error("Package ID not found")
      }

      // Calculate start and end dates (use tripdate or createdAt)
      const tripDate = booking.tripdate ? new Date(booking.tripdate) : new Date(booking.createdAt)
      const startDate = tripDate.toISOString().split('T')[0]
      
      // Get package duration - default to 7 days
      let packageDuration = 7
      if (booking.packageId?.duration) {
        packageDuration = booking.packageId.duration
      } else {
        // Try to fetch package details
        try {
          const packageResponse = await axios.get(`${API_BASE_URL}/api/admin/packages/showPackage`, {
            headers: { 'Authorization': `Bearer ${token}` },
            params: { id: packageId }
          })
          if (packageResponse.data.status && packageResponse.data.data) {
            const pkg = Array.isArray(packageResponse.data.data) 
              ? packageResponse.data.data.find((p: any) => p._id === packageId)
              : packageResponse.data.data
            if (pkg?.duration) {
              packageDuration = pkg.duration
            }
          }
        } catch (e) {
          console.log("Could not fetch package duration, using default 7 days")
        }
      }
      
      const endDate = new Date(tripDate.getTime() + packageDuration * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      // Update booking with captainId
      await axios.put(
        `${API_BASE_URL}/api/admin/booking/${bookingId}`,
        { captainId },
        { headers: { 'Authorization': `Bearer ${token}` } }
      )

      // Check if assignment already exists for this booking
      let assignmentExists = false
      try {
        const existingAssignments = await axios.get(
          `${API_BASE_URL}/api/admin/captain-assignment/all`,
          { 
            headers: { 'Authorization': `Bearer ${token}` },
            params: { bookingId, limit: 100 }
          }
        )
        if (existingAssignments.data.status && existingAssignments.data.data?.assignments?.length > 0) {
          assignmentExists = true
          // Update existing assignment
          const existingAssignment = existingAssignments.data.data.assignments[0]
          await axios.put(
            `${API_BASE_URL}/api/admin/captain-assignment/update/${existingAssignment._id}`,
            {
              captainId,
              startDate,
              endDate,
              status: 'assigned'
            },
            { headers: { 'Authorization': `Bearer ${token}` } }
          )
        }
      } catch (e) {
        console.log("Checking existing assignments:", e)
      }

      // Create new captain assignment if it doesn't exist
      if (!assignmentExists) {
        const assignmentResponse = await axios.post(
          "${API_BASE_URL}/api/admin/captain-assignment/add",
          {
            captainId,
            packageId,
            bookingId,
            startDate,
            endDate,
            status: 'assigned'
          },
          { headers: { 'Authorization': `Bearer ${token}` } }
        )

        if (!assignmentResponse.data.status) {
          throw new Error(assignmentResponse.data.message || "Failed to create assignment")
        }
      }

      toast({
        title: "Success",
        description: "Captain assigned successfully",
      })
      
      // Refresh bookings
      const bookingsResponse = await axios.get("${API_BASE_URL}/api/admin/booking/getBooking", {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (bookingsResponse.data.status && bookingsResponse.data.data) {
        setBookings(bookingsResponse.data.data)
      }
      
      // Refresh selected booking
      if (selectedBooking?._id === bookingId) {
        const updatedBookingResponse = await axios.get(`${API_BASE_URL}/api/admin/booking/${bookingId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (updatedBookingResponse.data.status && updatedBookingResponse.data.data) {
          setSelectedBooking(updatedBookingResponse.data.data)
          setShowCaptainSelect(false)
        }
      }
    } catch (error: any) {
      console.error("Error assigning captain:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message || "Failed to assign captain",
        variant: "destructive",
      })
    } finally {
      setAssigningCaptain(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    return moment(dateString).tz("Asia/Kolkata").format("DD MMM YYYY")
  }

  const stats = {
    total: bookings.length,
    active: bookings.filter((b) => b.status.toLowerCase() === "active").length,
    withGuests: bookings.filter((b) => b.totalGuests > 0).length,
    totalRevenue: bookings.reduce((sum, b) => sum + b.totalAmount, 0),
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bookings Management</h1>
        <p className="text-muted-foreground">View and manage all customer bookings</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by booking ID, customer name, or package..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Booking Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading bookings...</div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No bookings found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Booking Date</TableHead>
                  <TableHead>Guests</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Assigned Captain</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking._id}>
                    <TableCell className="font-mono text-sm">
                      {booking._id.slice(-8).toUpperCase()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div className="font-medium">{booking.userName}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{booking.packageName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">
                          {formatDate(booking.createdAt)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span>{booking.totalGuests}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      ₹{booking.totalAmount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {booking.assignedCaptain ? (
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium">{booking.assignedCaptain.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not Assigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={booking.status.toLowerCase() === "active" ? "default" : "secondary"}>
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleViewDetails(booking)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Booking Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-6">
              {/* Booking ID and Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Booking ID</p>
                  <p className="font-mono font-medium">
                    {selectedBooking._id.slice(-8).toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Booking Status</p>
                  <Badge variant={selectedBooking.status.toLowerCase() === "active" ? "default" : "secondary"}>
                    {selectedBooking.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Status</p>
                  <Badge 
                    variant={
                      selectedBooking.paymentStatus === "completed" ? "default" : 
                      selectedBooking.paymentStatus === "pending" ? "secondary" : 
                      "destructive"
                    }
                  >
                    {selectedBooking.paymentStatus || "pending"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Booking Date</p>
                  <p className="font-medium">
                    {formatDate(selectedBooking.createdAt)}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Customer Information */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Customer Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{selectedBooking.userName}</p>
                  </div>
                  {selectedBooking.userEmail && (
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        Email
                      </p>
                      <p className="font-medium">{selectedBooking.userEmail}</p>
                    </div>
                  )}
                  {selectedBooking.userPhone && (
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        Phone
                      </p>
                      <p className="font-medium">{selectedBooking.userPhone}</p>
                    </div>
                  )}
                  {selectedBooking.userAddress && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">{selectedBooking.userAddress}</p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Package Information */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Package Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Package Name</p>
                    <p className="font-medium">{selectedBooking.packageName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Trip Date</p>
                    <p className="font-medium">
                      {formatDate(selectedBooking.tripdate || "")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Guests</p>
                    <p className="font-medium">{selectedBooking.totalGuests}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Pricing Breakdown */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Pricing Breakdown
                </h3>
                <div className="space-y-2">
                  {selectedBooking.baseAmount !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Base Amount</span>
                      <span className="font-medium">₹{selectedBooking.baseAmount.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedBooking.discountAmount !== undefined && selectedBooking.discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span className="text-sm">Discount</span>
                      <span className="font-medium">-₹{selectedBooking.discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Final Amount</span>
                    <span>₹{(selectedBooking.finalAmount || selectedBooking.totalAmount || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Coupon/Promo Code */}
              {(selectedBooking.couponCode || selectedBooking.promoCode) && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Applied Discount
                    </h3>
                    {selectedBooking.couponCode && (
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Tag className="h-4 w-4" />
                          <span className="font-medium">Coupon Code: {selectedBooking.couponCode.code}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{selectedBooking.couponCode.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedBooking.couponCode.discountType === 'percentage' 
                            ? `${selectedBooking.couponCode.discountValue}% off`
                            : `₹${selectedBooking.couponCode.discountValue} off`}
                        </p>
                      </div>
                    )}
                    {selectedBooking.promoCode && (
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Percent className="h-4 w-4" />
                          <span className="font-medium">Promo Code: {selectedBooking.promoCode.code}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{selectedBooking.promoCode.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedBooking.promoCode.discountType === 'percentage' 
                            ? `${selectedBooking.promoCode.discountValue}% off`
                            : `₹${selectedBooking.promoCode.discountValue} off`}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Payment Information */}
              {selectedBooking.paymentStatus && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Payment Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedBooking.paymentId && (
                        <div>
                          <p className="text-sm text-muted-foreground">Payment ID</p>
                          <p className="font-mono text-sm">{selectedBooking.paymentId}</p>
                        </div>
                      )}
                      {selectedBooking.orderId && (
                        <div>
                          <p className="text-sm text-muted-foreground">Order ID</p>
                          <p className="font-mono text-sm">{selectedBooking.orderId}</p>
                        </div>
                      )}
                      {selectedBooking.paymentMethod && (
                        <div>
                          <p className="text-sm text-muted-foreground">Payment Method</p>
                          <p className="font-medium capitalize">{selectedBooking.paymentMethod}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {selectedBooking.guestDetails && selectedBooking.guestDetails.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Guest Details</h3>
                  <div className="space-y-3">
                    {selectedBooking.guestDetails.map((guest, index) => (
                      <Card key={guest._id}>
                        <CardContent className="pt-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-sm text-muted-foreground">Guest {index + 1}</p>
                              <p className="font-medium">
                                {guest.guestName || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Age</p>
                              <p className="font-medium">{guest.guestAge || "N/A"}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Gender</p>
                              <p className="font-medium">{guest.guestGender || "N/A"}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-sm text-muted-foreground">Address</p>
                              <p className="font-medium">{guest.guestAddress || "N/A"}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {selectedBooking.totalGuests === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No guest details available for this booking
                </div>
              )}

              {/* Captain Assignment Section */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Captain Assignment</h3>
                {selectedBooking.assignedCaptain && !showCaptainSelect ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="font-medium">{selectedBooking.assignedCaptain.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedBooking.assignedCaptain.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCaptainSelect(true)}
                      disabled={assigningCaptain}
                    >
                      Change Captain
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Select
                      onValueChange={(value) => handleAssignCaptain(selectedBooking._id, value)}
                      disabled={assigningCaptain}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Captain to Assign" />
                      </SelectTrigger>
                      <SelectContent>
                        {captains.filter(captain => captain._id && captain._id.trim() !== "").map((captain) => (
                          <SelectItem key={captain._id} value={captain._id}>
                            {captain.name} - {captain.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {showCaptainSelect && selectedBooking.assignedCaptain && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowCaptainSelect(false)}
                      >
                        Cancel
                      </Button>
                    )}
                    {assigningCaptain && (
                      <p className="text-sm text-muted-foreground">Assigning captain...</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}