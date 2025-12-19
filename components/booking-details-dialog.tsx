"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar, User, Mail, MapPin, Users, DollarSign, CreditCard } from "lucide-react"
import type { Booking } from "@/lib/mock-data"

interface BookingDetailsDialogProps {
  booking: Booking | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BookingDetailsDialog({ booking, open, onOpenChange }: BookingDetailsDialogProps) {
  if (!booking) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Booking Details</DialogTitle>
          <DialogDescription>Complete information about this booking</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Booking ID and Status */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Booking ID</p>
              <p className="font-mono font-semibold">{booking.id}</p>
            </div>
            <div className="flex gap-2">
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
              <Badge
                variant={
                  booking.paymentStatus === "paid"
                    ? "default"
                    : booking.paymentStatus === "pending"
                      ? "secondary"
                      : "destructive"
                }
              >
                {booking.paymentStatus}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Customer Information */}
          <div>
            <h3 className="font-semibold mb-3">Customer Information</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{booking.userName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{booking.userEmail}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Number of Guests:</span>
                <span className="font-medium">{booking.guests}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Trip Information */}
          <div>
            <h3 className="font-semibold mb-3">Trip Information</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Trip:</span>
                <span className="font-medium">{booking.tripTitle}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Travel Date:</span>
                <span className="font-medium">{new Date(booking.travelDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Booking Date:</span>
                <span className="font-medium">{new Date(booking.bookingDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment Information */}
          <div>
            <h3 className="font-semibold mb-3">Payment Information</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-semibold text-lg">₹{booking.amount.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Payment Status:</span>
                <Badge
                  variant={
                    booking.paymentStatus === "paid"
                      ? "default"
                      : booking.paymentStatus === "pending"
                        ? "secondary"
                        : "destructive"
                  }
                >
                  {booking.paymentStatus}
                </Badge>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Amount</span>
              <span className="text-2xl font-bold">₹{booking.amount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
