"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, Mail, Phone, Calendar, ShoppingBag, DollarSign } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Customer } from "@/lib/mock-data"
import { mockBookings } from "@/lib/mock-data"

interface UserDetailsDialogProps {
  user: Customer | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserDetailsDialog({ user, open, onOpenChange }: UserDetailsDialogProps) {
  if (!user) return null

  // Filter bookings for the selected user
  const userBookings = mockBookings.filter((booking) => booking.userId === user.id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* ✅ Increased width from max-w-4xl → max-w-6xl */}
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>
            Complete information about this user and their booking history
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 🧍 User Info */}
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Name:</span>
                <span className="font-semibold">{user.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Phone:</span>
                <span className="font-medium">{user.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Joined:</span>
                <span className="font-medium">
                  {new Date(user.joinedDate).toLocaleDateString()}
                </span>
              </div>
            </div>
            <Badge
              variant={user.status === "active" ? "default" : "destructive"}
              className="text-sm"
            >
              {user.status}
            </Badge>
          </div>

          <Separator />

          {/* 📊 Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                  Total Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{user.totalBookings}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  Total Spent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{user.totalSpent.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Avg. per Booking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹
                  {user.totalBookings > 0
                    ? Math.round(user.totalSpent / user.totalBookings).toLocaleString()
                    : 0}
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* 🧾 Booking History */}
          <div>
            <h3 className="font-semibold mb-4">Booking History</h3>
            {userBookings.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking ID</TableHead>
                    <TableHead>Trip</TableHead>
                    <TableHead>Travel Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      {/* ✅ Show only last 8 characters in uppercase */}
                      <TableCell className="font-mono text-sm">
                        {booking.id.slice(-8).toUpperCase()}
                      </TableCell>
                      <TableCell>{booking.tripTitle}</TableCell>
                      <TableCell>
                        {new Date(booking.travelDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        ₹{booking.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            booking.status === "confirmed"
                              ? "default"
                              : booking.status === "pending"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {booking.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No bookings found for this user
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
