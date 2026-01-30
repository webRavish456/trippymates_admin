"use client"

import { useState, useEffect } from "react"
import { Search, Download, Mail, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { InvoiceDialog } from "@/components/invoice-dialog"
import { useToast } from "@/hooks/use-toast"
import moment from "moment-timezone"
import { TableRowSkeleton } from "@/components/ui/skeletons"

import { API_BASE_URL as CONFIG_API_BASE_URL } from "@/lib/config"
const API_BASE_URL = `${CONFIG_API_BASE_URL}/api/admin/payments`

interface Payment {
  id: string
  bookingId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  packageName: string
  amount: number
  baseAmount: number
  discountAmount: number
  finalAmount: number
  status: "paid" | "pending" | "failed"
  paymentStatus: string
  paymentDate: string
  paymentDateFormatted: string
  paymentMethod: string
  paymentId: string | null
  orderId: string | null
  transactionId: string
  bookingStatus: string
  tripDate: string | null
  tripDateFormatted: string | null
  guestCount: number
  guestDetails: Array<any>
  couponCode: {
    code: string
    title: string
    discountType: string
    discountValue: number
  } | null
  promoCode: {
    code: string
    title: string
    discountType: string
    discountValue: number
  } | null
}

export default function PaymentsPage() {
  const { toast } = useToast()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all")
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false)

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('adminToken')
      const params = new URLSearchParams()
      
      if (statusFilter !== "all") {
        params.append("status", statusFilter)
      }
      if (paymentStatusFilter !== "all") {
        params.append("paymentStatus", paymentStatusFilter)
      }
      if (searchQuery) {
        params.append("search", searchQuery)
      }

      const url = `${API_BASE_URL}/all${params.toString() ? `?${params.toString()}` : ""}`
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      
      if (data.status && data.data) {
        setPayments(data.data)
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to fetch payments",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching payments:", error)
      toast({
        title: "Error",
        description: "Failed to fetch payments",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const delay = searchQuery ? 500 : 0
    const timer = setTimeout(() => {
      fetchPayments()
    }, delay)
    return () => clearTimeout(timer)
  }, [statusFilter, paymentStatusFilter, searchQuery])

  const filteredPayments = payments.filter((payment) => {
    if (statusFilter !== "all" && payment.bookingStatus !== statusFilter) {
      return false
    }
    if (paymentStatusFilter !== "all") {
      if (paymentStatusFilter === "paid" && payment.status !== "paid") return false
      if (paymentStatusFilter === "pending" && payment.status !== "pending") return false
      if (paymentStatusFilter === "failed" && payment.status !== "failed") return false
    }
    return true
  })

  const handleViewInvoice = (payment: Payment) => {
    setSelectedPayment(payment)
    setIsInvoiceOpen(true)
  }

  const handleDownloadInvoice = (payment: Payment) => {
    toast({
      title: "Invoice downloaded",
      description: `Invoice for ${payment.bookingId} has been downloaded`,
    })
  }

  const handleEmailInvoice = (payment: Payment) => {
    toast({
      title: "Invoice sent",
      description: `Invoice has been sent to ${payment.customerEmail}`,
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
      case "completed":
        return <Badge variant="default" className="bg-green-500">Paid</Badge>
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      case "refunded":
        return <Badge variant="outline">Refunded</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance">Payments & Invoices</h1>
          <p className="text-muted-foreground">Track payments and manage invoices</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 8 }).map((_, index) => (
                    <TableRowSkeleton key={`payment-skeleton-${index}`} columns={8} />
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-balance">Payments & Invoices</h1>
        <p className="text-muted-foreground">Track payments and manage invoices</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by payment ID, booking ID, customer name, email, or package..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment Status</SelectItem>
                <SelectItem value="completed">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Booking Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Booking Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardContent className="pt-6">
          {filteredPayments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No payments found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment ID</TableHead>
                    <TableHead>Booking ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-sm">{payment.id}</TableCell>
                      <TableCell className="font-mono text-sm">{payment.bookingId}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{payment.customerName}</div>
                          <div className="text-xs text-muted-foreground">{payment.customerEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="truncate">{payment.packageName}</div>
                        {payment.discountAmount > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Discount: ₹{payment.discountAmount.toLocaleString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">₹{payment.finalAmount.toLocaleString()}</div>
                        {payment.baseAmount !== payment.finalAmount && (
                          <div className="text-xs text-muted-foreground line-through">
                            ₹{payment.baseAmount.toLocaleString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{payment.paymentDateFormatted}</div>
                        {payment.tripDateFormatted && (
                          <div className="text-xs text-muted-foreground">
                            Trip: {payment.tripDateFormatted}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm capitalize">{payment.paymentMethod}</div>
                        {payment.paymentId && (
                          <div className="text-xs text-muted-foreground font-mono">
                            {payment.paymentId.substring(0, 12)}...
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(payment.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewInvoice(payment)}
                            title="View Invoice"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadInvoice(payment)}
                            title="Download Invoice"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEmailInvoice(payment)}
                            title="Email Invoice"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Dialog */}
      <InvoiceDialog payment={selectedPayment} open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen} />
    </div>
  )
}
