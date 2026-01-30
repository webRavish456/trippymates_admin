"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Edit, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
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

interface Banner {
  _id: string
  title: string
  description?: string
  image: string
  link?: string
  status: 'active' | 'inactive'
  createdAt: string
}

const API_BASE = `${API_BASE_URL}/api/admin/banner`

type BannersPermission = {
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

export function BannerTab() {
  const permissions = useSelector(
    (state: RootState) => state.permission.permissions
  )
  const [hasPermission, setHasPermission] = useState<BannersPermission>({
    create: false,
    update: false,
    delete: false,
  })
 
  const router = useRouter()
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { toast } = useToast()

  useEffect(() => {
    const bannersPermission = permissions.find(
      (p: Permission) => p.module === "banner"
    )
    setHasPermission({
      create: bannersPermission?.create ?? false,
      update: bannersPermission?.update ?? false,
      delete: bannersPermission?.delete ?? false,
    })
  }, [permissions])

  useEffect(() => {
    const delay = searchQuery ? 500 : 0
    const timeoutId = setTimeout(() => {
      fetchBanners(currentPage, searchQuery)
    }, delay)
    return () => clearTimeout(timeoutId)
  }, [currentPage, searchQuery])

  const fetchBanners = async (page = 1, search = "") => {
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
        let filteredBanners = data.data.banners || []
        if (search) {
          filteredBanners = filteredBanners.filter((b: Banner) => 
            b.title.toLowerCase().includes(search.toLowerCase())
          )
        }
        setBanners(filteredBanners)
        if (data.data.pagination) {
          setCurrentPage(data.data.pagination.page)
          setTotalPages(data.data.pagination.pages)
        }
      } else {
        throw new Error(data.message || "Failed to fetch banners")
      }
    } catch (error: any) {
      console.error("Fetch error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to fetch banners",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleDeleteBanner = async () => {
    if (!selectedBanner) return

    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${API_BASE}/delete/${selectedBanner._id}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()

      if (result.status) {
        toast({
          title: "Success",
          description: "Banner deleted successfully",
        })
        setIsDeleteDialogOpen(false)
        setSelectedBanner(null)
        fetchBanners(currentPage, searchQuery)
      } else {
        throw new Error(result.message || "Failed to delete banner")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete banner",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      inactive: "secondary"
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
          <h2 className="text-2xl font-bold">Banners</h2>
          <p className="text-sm text-muted-foreground">Manage website banners and promotional images</p>
        </div>
        {hasPermission.create && <Button onClick={() => router.push("/admin/banner/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Add Banner
        </Button>}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search banners by title..."
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
                    <TableHead>Image</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <TableRowSkeleton key={`banner-skeleton-${index}`} columns={5} />
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : banners.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No banners found</div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {banners.map((banner) => (
                      <TableRow key={banner._id}>
                        <TableCell>
                          {banner.image && (
                            <img src={banner.image} alt={banner.title} className="w-16 h-16 object-cover rounded" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{banner.title}</TableCell>
                        <TableCell>{getStatusBadge(banner.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {hasPermission.update && <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/admin/banner/${banner._id}`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>}
                            {hasPermission.delete && <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedBanner(banner)
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
            <AlertDialogTitle>Delete Banner</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedBanner?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBanner} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

