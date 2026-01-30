"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { API_BASE_URL } from "@/lib/config"
import { useToast } from "@/hooks/use-toast"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { TableRowSkeleton } from "@/components/ui/skeletons"
import { Award } from "lucide-react"

interface RewardTransaction {
  _id: string
  userId: { _id: string; name?: string; email?: string; phone?: string }
  bookingId: {
    _id: string
    bookingId?: string
    status?: string
    tripdate?: string
    finalAmount?: number
    packageId?: { title?: string }
  }
  rewardPercent: number
  bookingAmount: number
  rewardAmount: number
  status: string
  createdAt: string
}

export function RewardManagementTab() {
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<RewardTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchTransactions(currentPage)
  }, [currentPage])

  const fetchTransactions = async (page: number) => {
    try {
      setLoading(true)
      const token = localStorage.getItem("adminToken")
      const params = new URLSearchParams({ page: page.toString(), limit: "10" })
      const response = await fetch(`${API_BASE_URL}/api/admin/reward/transactions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()

      if (data.status && data.data) {
        setTransactions(data.data.transactions || [])
        if (data.data.pagination) {
          setCurrentPage(data.data.pagination.page)
          setTotalPages(data.data.pagination.pages)
        }
      } else {
        setTransactions([])
      }
    } catch (error) {
      console.error("Fetch reward transactions error:", error)
      toast({
        title: "Error",
        description: "Failed to load reward transactions",
        variant: "destructive",
      })
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "—"
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Reward Management</h2>
        <p className="text-sm text-muted-foreground">
          Rewards given to users when their trip is completed (1% of booking amount)
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Booking</TableHead>
                    <TableHead>Trip Date</TableHead>
                    <TableHead>Booking Amount</TableHead>
                    <TableHead>Reward %</TableHead>
                    <TableHead>Reward Amount</TableHead>
                    <TableHead>Date Given</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <TableRowSkeleton key={index} columns={7} />
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Award className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No reward transactions yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                When a booking is marked as Completed, the user gets 1% reward. It will appear here.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Booking</TableHead>
                      <TableHead>Trip Date</TableHead>
                      <TableHead>Booking Amount</TableHead>
                      <TableHead>Reward %</TableHead>
                      <TableHead>Reward Amount</TableHead>
                      <TableHead>Date Given</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx._id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {tx.userId?.name || "—"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {tx.userId?.email || "—"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <Badge variant="outline" className="font-mono">
                              {tx.bookingId?.bookingId || tx.bookingId?._id?.slice(-8) || "—"}
                            </Badge>
                            {tx.bookingId?.packageId?.title && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {tx.bookingId.packageId.title}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(tx.bookingId?.tripdate)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(tx.bookingAmount)}
                        </TableCell>
                        <TableCell>{tx.rewardPercent}%</TableCell>
                        <TableCell className="font-semibold text-green-700">
                          {formatCurrency(tx.rewardAmount)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(tx.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          currentPage > 1 && setCurrentPage(currentPage - 1)
                        }
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    )}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          currentPage < totalPages &&
                          setCurrentPage(currentPage + 1)
                        }
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
