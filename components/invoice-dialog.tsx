"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Download, Mail, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Payment {
  id: string
  bookingId: string
  customerName: string
  customerEmail: string
  tripTitle: string
  amount: number
  status: "paid" | "pending" | "failed"
  paymentDate: string
  paymentMethod: string
  transactionId: string
}

interface InvoiceDialogProps {
  payment: Payment | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InvoiceDialog({ payment, open, onOpenChange }: InvoiceDialogProps) {
  if (!payment) return null

  const taxRate = 0.18 // 18% GST
  const subtotal = payment.amount / (1 + taxRate)
  const tax = payment.amount - subtotal

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invoice</DialogTitle>
          <DialogDescription>Invoice details for booking {payment.bookingId}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">TravelAdmin</h2>
              </div>
              <p className="text-sm text-muted-foreground">Travel Booking Platform</p>
              <p className="text-sm text-muted-foreground">123 Travel Street, Mumbai, India</p>
              <p className="text-sm text-muted-foreground">GST: 27AABCT1234F1Z5</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold mb-2">INVOICE</div>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="text-muted-foreground">Invoice #:</span>
                  <span className="font-mono ml-2">{payment.id}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Date:</span>
                  <span className="ml-2">{new Date(payment.paymentDate).toLocaleDateString()}</span>
                </div>
                <div>
                  <Badge
                    variant={
                      payment.status === "paid" ? "default" : payment.status === "pending" ? "secondary" : "destructive"
                    }
                  >
                    {payment.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Bill To */}
          <div>
            <h3 className="font-semibold mb-2">Bill To:</h3>
            <div className="space-y-1 text-sm">
              <p className="font-medium">{payment.customerName}</p>
              <p className="text-muted-foreground">{payment.customerEmail}</p>
            </div>
          </div>

          <Separator />

          {/* Invoice Items */}
          <div>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-semibold">Description</th>
                  <th className="text-right py-2 font-semibold">Booking ID</th>
                  <th className="text-right py-2 font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3">
                    <div className="font-medium">{payment.tripTitle}</div>
                    <div className="text-sm text-muted-foreground">Travel Package</div>
                  </td>
                  <td className="text-right font-mono text-sm">{payment.bookingId}</td>
                  <td className="text-right font-medium">₹{subtotal.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">GST (18%):</span>
              <span className="font-medium">₹{tax.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>₹{payment.amount.toLocaleString()}</span>
            </div>
          </div>

          <Separator />

          {/* Payment Details */}
          <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Method:</span>
              <span className="font-medium">{payment.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transaction ID:</span>
              <span className="font-mono font-medium">{payment.transactionId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Date:</span>
              <span className="font-medium">{new Date(payment.paymentDate).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground">
            <p>Thank you for your business!</p>
            <p>For any queries, contact us at support@traveladmin.com</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline">
              <Mail className="h-4 w-4 mr-2" />
              Email Invoice
            </Button>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
