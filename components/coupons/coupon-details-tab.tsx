"use client"

import { useState, useEffect } from "react"
import { Search, Edit, Trash2, Calendar, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { API_BASE_URL } from "@/lib/config"
import { TableRowSkeleton } from "@/components/ui/skeletons"
import { RootState } from "../redux/store"
import { useSelector } from "react-redux"
import { useRouter } from "next/navigation"

interface Coupon {
  _id: string
  code: string
  title: string
  description?: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  minPurchaseAmount: number
  maxDiscountAmount?: number
  validFrom: string
  validUntil: string
  usedCount: number
  applicableTo: string
  status: 'active' | 'inactive' | 'expired'
  createdAt: string
}

const API_BASE = `${API_BASE_URL}/api/admin/coupon`

type CouponsPermission = {
  create: boolean;
  update: boolean;
  delete: boolean;
};
type Permission = {
  module: string;
  create: boolean;
  update: boolean;
  delete: boolean;
};

export function CouponDetailsTab() {

const router = useRouter()


  const permissions = useSelector(
    (state: RootState) => state.permission.permissions
  )
  const [hasPermission, setHasPermission] = useState<CouponsPermission>({
    create: false,
    update: false,
    delete: false,
  })

  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { toast } = useToast()

  useEffect(() => {
    fetchCoupons()
  }, [])

  useEffect(() => {
    const couponsPermission = permissions.find(
      (p: Permission) => p.module === "coupon_details"
    )
    setHasPermission({
      create: couponsPermission?.create ?? false,
      update: couponsPermission?.update ?? false,
      delete: couponsPermission?.delete ?? false,
    })
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchCoupons(1, searchQuery)
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const fetchCoupons = async (page = 1, search = "") => {
    try {
      setLoading(true)
      const token = localStorage.getItem('adminToken')
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      })
      
      const response = await fetch(`${API_BASE}/all?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      
      if (data.status) {
        let filteredCoupons = data.data.coupons || []
        if (search) {
          filteredCoupons = filteredCoupons.filter((c: Coupon) => 
            c.code.toLowerCase().includes(search.toLowerCase()) ||
            c.title.toLowerCase().includes(search.toLowerCase())
          )
        }
        setCoupons(filteredCoupons)
        if (data.data.pagination) {
          setCurrentPage(data.data.pagination.page)
          setTotalPages(data.data.pagination.pages)
        }
      }
      // Note: Empty array is valid response when success is true
    } catch (error: any) {
      console.error("Fetch error:", error)
      setCoupons([])
      // Don't show toast for GET requests
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchCoupons(page, searchQuery)
  }

  const handleDeleteCoupon = async () => {
    if (!selectedCoupon) return

    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${API_BASE}/delete/${selectedCoupon._id}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()

      if (result.status) {
        toast({
          title: "Success",
          description: "Coupon deleted successfully",
        })
        setIsDeleteDialogOpen(false)
        setSelectedCoupon(null)
        fetchCoupons(currentPage, searchQuery)
      } else {
        throw new Error(result.message || "Failed to delete coupon")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete coupon",
        variant: "destructive",
      })
    }
  }

  // Calculate actual status based on date
  const getActualStatus = (coupon: Coupon) => {
    const now = new Date()
    const validUntil = new Date(coupon.validUntil)
    
    if (validUntil < now) {
      return 'expired'
    }
    return coupon.status
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      inactive: "secondary",
      expired: "destructive"
    }
    return (
      <Badge variant={variants[status] || "default"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Coupon Details</h2>
          <p className="text-sm text-muted-foreground">View and manage all coupon codes</p>
        </div>
          {hasPermission.create && <Button onClick={() => router.push("/admin/coupon-code/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Coupon
        </Button>}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search coupons by code or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Valid Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <TableRowSkeleton key={index} columns={6} />
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No coupons found</div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Valid Period</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coupons.map((coupon) => (
                      <TableRow key={coupon._id}>
                        <TableCell className="font-mono font-semibold">{coupon.code}</TableCell>
                        <TableCell>{coupon.title}</TableCell>
                        <TableCell>
                          <div className="font-semibold">
                            {coupon.discountType === 'percentage' 
                              ? `${coupon.discountValue}%`
                              : `₹${coupon.discountValue}`
                            }
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-4 w-4" />
                            {new Date(coupon.validFrom).toLocaleDateString('en-GB', { timeZone: 'UTC' })} - {new Date(coupon.validUntil).toLocaleDateString('en-GB', { timeZone: 'UTC' })}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(getActualStatus(coupon))}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {hasPermission.update && <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // Navigate to edit page
                                window.location.href = `/admin/coupon-code/edit/${coupon._id}`
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>}
                            {hasPermission.delete && <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedCoupon(coupon)
                                setIsDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>}
                          </div>
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
                        onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => handlePageChange(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Coupon</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete coupon "{selectedCoupon?.code}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCoupon} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

