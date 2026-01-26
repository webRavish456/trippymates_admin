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

interface PromoCode {
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
  userLimit: number
  applicableTo: string
  status: 'active' | 'inactive' | 'expired'
  createdAt: string
}

const API_BASE = `${API_BASE_URL}/api/admin/promo-code`

type PromotionsPermission = {
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

export function PromoCodeDetailsTab() {
  
  const router = useRouter()


  const permissions = useSelector(
    (state: RootState) => state.permission.permissions
  )
  const [hasPermission, setHasPermission] = useState<PromotionsPermission>({
    create: false,
    update: false,
    delete: false,
  })
 
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedPromoCode, setSelectedPromoCode] = useState<PromoCode | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { toast } = useToast()

  useEffect(() => {
    fetchPromoCodes()
  }, [])

  useEffect(() => {
    const promotionsPermission = permissions.find(
      (p: Permission) => p.module === "promo_details"
    )
    setHasPermission({
      create: promotionsPermission?.create ?? false,
      update: promotionsPermission?.update ?? false,
      delete: promotionsPermission?.delete ?? false,
    })
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchPromoCodes(1, searchQuery)
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const fetchPromoCodes = async (page = 1, search = "") => {
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
        let filteredPromoCodes = data.data.promoCodes || []
        if (search) {
          filteredPromoCodes = filteredPromoCodes.filter((p: PromoCode) => 
            p.code.toLowerCase().includes(search.toLowerCase()) ||
            p.title.toLowerCase().includes(search.toLowerCase())
          )
        }
        setPromoCodes(filteredPromoCodes)
        if (data.data.pagination) {
          setCurrentPage(data.data.pagination.page)
          setTotalPages(data.data.pagination.pages)
        }
      }
      // Note: Empty array is valid response when success is true
    } catch (error: any) {
      console.error("Fetch error:", error)
      setPromoCodes([])
      // Don't show toast for GET requests
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchPromoCodes(page, searchQuery)
  }

  const handleDeletePromoCode = async () => {
    if (!selectedPromoCode) return

    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${API_BASE}/delete/${selectedPromoCode._id}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()

      if (result.status) {
        toast({
          title: "Success",
          description: "Promo code deleted successfully",
        })
        setIsDeleteDialogOpen(false)
        setSelectedPromoCode(null)
        fetchPromoCodes(currentPage, searchQuery)
      } else {
        throw new Error(result.message || "Failed to delete promo code")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete promo code",
        variant: "destructive",
      })
    }
  }

  // Calculate actual status based on date
  const getActualStatus = (promoCode: PromoCode) => {
    const now = new Date()
    const validUntil = new Date(promoCode.validUntil)
    
    if (validUntil < now) {
      return 'expired'
    }
    return promoCode.status
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
          <h2 className="text-2xl font-bold">Promo Code Details</h2>
          <p className="text-sm text-muted-foreground">View and manage all promo codes</p>
        </div>
        {hasPermission.create && <Button onClick={() => router.push("/admin/promo-code/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Promo Code
        </Button>}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search promo codes by code or title..."
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
                    <TableHead>User Limit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <TableRowSkeleton key={index} columns={7} />
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : promoCodes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No promo codes found</div>
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
                      <TableHead>User Limit</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {promoCodes.map((promoCode) => (
                      <TableRow key={promoCode._id}>
                        <TableCell className="font-mono font-semibold">{promoCode.code}</TableCell>
                        <TableCell>{promoCode.title}</TableCell>
                        <TableCell>
                          <div className="font-semibold">
                            {promoCode.discountType === 'percentage' 
                              ? `${promoCode.discountValue}%`
                              : `₹${promoCode.discountValue}`
                            }
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-4 w-4" />
                            {new Date(promoCode.validFrom).toLocaleDateString('en-GB', { timeZone: 'UTC' })} - {new Date(promoCode.validUntil).toLocaleDateString('en-GB', { timeZone: 'UTC' })}
                          </div>
                        </TableCell>
                        <TableCell>
                          {promoCode.userLimit === null || promoCode.userLimit === 0 
                            ? "Unlimited" 
                            : `${promoCode.userLimit} per user`}
                        </TableCell>
                        <TableCell>{getStatusBadge(getActualStatus(promoCode))}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {hasPermission.update && <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // Navigate to edit page
                                window.location.href = `/admin/promo-code/edit/${promoCode._id}`
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>}
                            {hasPermission.delete && <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedPromoCode(promoCode)
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
            <AlertDialogTitle>Delete Promo Code</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete promo code "{selectedPromoCode?.code}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePromoCode} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

