"use client"

import { useState, useEffect } from "react"
import { Search, MapPin, Calendar, Users, Eye, Building2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"


import { API_BASE_URL as CONFIG_API_BASE_URL } from "@/lib/config"
const API_BASE_URL = `${CONFIG_API_BASE_URL}/api/admin/trip`

interface Slot {
  slotId: string
  slotName: string
  createdBy: {
    _id: string
    name: string
    email: string
    phone: string
  }
  maxSlots: number
  currentBookings: number
  availableSlots: number
  status: string
  participants: number
  bookings: Array<{
    bookingId: string
    userId: string
    userName: string
    userEmail: string
    userPhone: string
    guestCount: number
    guestDetails: Array<any>
    bookingStatus: string
    paymentStatus: string
  }>
  createdAt: string
}

interface Trip {
  packageId: string
  packageName: string
  packageDuration: string
  packageCategory: string
  packageType: string
  tripDate: string
  tripDateFormatted: string
  daysUntilTrip: number
  isUpcoming: boolean
  destinationId: string
  destinationName: string
  destinationLocation: string
  slots: Slot[]
  totalSlots: number
  totalBookings: number
  totalParticipants: number
  totalCapacity: number
  availableCapacity: number
}

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const { toast } = useToast()

  const fetchTrips = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${API_BASE_URL}/active-trips`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.status) {
        setTrips(data.data || [])
      }
    } catch (error) {
      console.error("Error fetching trips:", error)
      setTrips([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrips()
  }, [])

  const filteredTrips = trips.filter((trip) => {
    const matchesSearch =
      trip.packageName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.destinationName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.destinationLocation?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const handleViewDetails = (trip: Trip) => {
    setSelectedTrip(trip)
    setIsDetailsOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading trips...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Trip Management</h1>
        <p className="text-muted-foreground">View active trips with slot details and participant information</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by package name, destination, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {filteredTrips.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No trips found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Package</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Trip Date</TableHead>
                  <TableHead>Days Until</TableHead>
                  <TableHead>Slots</TableHead>
                  <TableHead>Participants</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrips.map((trip, index) => (
                  <TableRow key={`${trip.packageId}_${trip.tripDate}_${index}`} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="font-medium">{trip.packageName}</div>
                      <div className="text-sm text-muted-foreground">{trip.packageDuration}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{trip.destinationName}</div>
                          <div className="text-xs text-muted-foreground">{trip.destinationLocation}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{trip.tripDateFormatted}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={trip.daysUntilTrip < 0 ? "destructive" : trip.daysUntilTrip <= 7 ? "default" : "secondary"}>
                        {trip.daysUntilTrip < 0 ? "Past" : trip.daysUntilTrip === 0 ? "Today" : `${trip.daysUntilTrip} days`}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Building2Icon className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{trip.totalSlots}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{trip.totalParticipants}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{trip.totalParticipants}/{trip.totalCapacity}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleViewDetails(trip)}>
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

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Trip Details</DialogTitle>
          </DialogHeader>
          {selectedTrip && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Package Name</p>
                  <p className="font-medium text-lg">{selectedTrip.packageName}</p>
                  <p className="text-sm text-muted-foreground mt-1">{selectedTrip.packageDuration}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Destination</p>
                  <p className="font-medium text-lg">{selectedTrip.destinationName}</p>
                  <p className="text-sm text-muted-foreground mt-1">{selectedTrip.destinationLocation}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Trip Date</p>
                  <p className="font-medium">{selectedTrip.tripDateFormatted}</p>
                  <Badge variant={selectedTrip.daysUntilTrip < 0 ? "destructive" : selectedTrip.daysUntilTrip <= 7 ? "default" : "secondary"} className="mt-1">
                    {selectedTrip.daysUntilTrip < 0 ? "Past" : selectedTrip.daysUntilTrip === 0 ? "Today" : `${selectedTrip.daysUntilTrip} days until trip`}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <Badge variant="outline">{selectedTrip.packageCategory}</Badge>
                  {selectedTrip.packageType && (
                    <Badge variant="outline" className="ml-2">{selectedTrip.packageType}</Badge>
                  )}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Slots</p>
                  <p className="text-2xl font-bold">{selectedTrip.totalSlots}</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Participants</p>
                  <p className="text-2xl font-bold">{selectedTrip.totalParticipants}</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Capacity</p>
                  <p className="text-2xl font-bold">{selectedTrip.totalCapacity}</p>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">Slot Details</h3>
                <div className="space-y-4">
                  {selectedTrip.slots.map((slot) => (
                    <Card key={slot.slotId}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base">{slot.slotName}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              Created by: {slot.createdBy.name} ({slot.createdBy.email})
                            </p>
                          </div>
                          <Badge variant={slot.status === "full" ? "default" : "secondary"}>
                            {slot.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Max Slots</p>
                            <p className="font-medium">{slot.maxSlots}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Current Bookings</p>
                            <p className="font-medium">{slot.currentBookings}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Available</p>
                            <p className="font-medium">{slot.availableSlots}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Participants</p>
                            <p className="font-medium">{slot.participants}</p>
                          </div>
                        </div>

                        {slot.bookings.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">Bookings in this slot:</p>
                            <div className="space-y-2">
                              {slot.bookings.map((booking) => (
                                <div key={booking.bookingId} className="p-3 bg-muted rounded-lg">
                                  <div className="flex items-center justify-between mb-2">
                                    <div>
                                      <p className="font-medium">{booking.userName}</p>
                                      <p className="text-xs text-muted-foreground">{booking.userEmail}</p>
                                    </div>
                                    <div className="flex gap-2">
                                      <Badge variant={booking.paymentStatus === "completed" ? "default" : "secondary"}>
                                        {booking.paymentStatus}
                                      </Badge>
                                      <Badge variant="outline">
                                        {booking.guestCount} guest(s)
                                      </Badge>
                                    </div>
                                  </div>
                                  {booking.guestDetails && booking.guestDetails.length > 0 && (
                                    <div className="mt-2 pt-2 border-t">
                                      <p className="text-xs text-muted-foreground mb-1">Guest Details:</p>
                                      <div className="space-y-1">
                                        {booking.guestDetails.map((guest, idx) => (
                                          <div key={idx} className="text-xs">
                                            {guest.guestName} ({guest.guestAge} years, {guest.guestGender})
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
