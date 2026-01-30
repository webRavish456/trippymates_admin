"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Edit, Trash2, MapPin, Calendar, Eye } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { API_BASE_URL } from "@/lib/config"
import { TableRowSkeleton } from "@/components/ui/skeletons"
import { useSelector } from "react-redux"
import { RootState } from "../redux/store"

interface Package {
  _id: string
  title: string
  duration: string
  source: string
  destination: string
  category?: string
  price?: {
    adult: number
    child: number
    infant: number
    currency?: string
  }
  discount?: {
    percentage: number
    validFrom: string
    validUntil: string
  }
  images: string[]
  highlights?: string[]
  status?: string
  createdAt: string
}

const API_BASE = `${API_BASE_URL}/api/admin/packages`

type PackagesPermission = {
  create: boolean;
  update: boolean;
  delete: boolean;
};

type Permission = {
  module: string;
  create: boolean;
  read?: boolean;
  update?: boolean;
  delete?: boolean;
};

export function PackagesTab() {

  const permissions = useSelector(
    (state: RootState) => state.permission.permissions
  ) 

  const [hasPermission, setHasPermission] = useState<PackagesPermission>({
    create: false,
    update: false,
    delete: false,
  })
 
  const router = useRouter()
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [viewPackageData, setViewPackageData] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [packageCategories, setPackageCategories] = useState<Array<{ id: string; label: string; color: string }>>([
    { id: "", label: "All Categories", color: "" }
  ])
  const { toast } = useToast()

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    const packagesPermission = permissions.find(
      (p: Permission) => p.module === "packages"
    )
    setHasPermission({
      create: packagesPermission?.create ?? false,
      update: packagesPermission?.update ?? false,
      delete: packagesPermission?.delete ?? false,
    })
  }, [permissions])

  useEffect(() => {
    const delay = searchQuery ? 500 : 0
    const timeoutId = setTimeout(() => {
      fetchPackages(currentPage, searchQuery)
    }, delay)
    return () => clearTimeout(timeoutId)
  }, [currentPage, searchQuery])

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/categories`)
      const data = await response.json()
      
      if (data.status && data.data) {
        setPackageCategories([
          { id: "", label: "All Categories", color: "" },
          ...data.data
        ])
      }
    } catch (error: any) {
      console.error("Fetch categories error:", error)
      // Keep default categories on error
    }
  }

  const fetchPackages = async (page = 1, search = "") => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search && { search }),
      })
      
      const response = await fetch(`${API_BASE}/showPackage?${params}`)
      const data = await response.json()
      
      // Success response with data (can be empty array)
      if (data.status) {
        setPackages(data.data || [])
        if (data.pagination) {
          setCurrentPage(data.pagination.currentPage)
          setTotalPages(data.pagination.totalPages)
        }
      }
    } catch (error: any) {
      console.error("Fetch error:", error)
      setPackages([])
      // Don't show toast for GET requests
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleViewPackage = async (pkg: Package) => {
    try {
      const response = await fetch(`${API_BASE}/packagedetail`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: pkg._id }),
      })

      const result = await response.json()

      if (result.status && result.data) {
        setViewPackageData(result.data)
        setIsViewModalOpen(true)
      }
    } catch (error: any) {
      console.error("Fetch error:", error)
      // Don't show toast for GET requests
    }
  }

  const handleDeletePackage = async () => {
    if (!selectedPackage) return

    try {
      const response = await fetch(`${API_BASE}/DeletePackage/${selectedPackage._id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.status || result.success) {
        toast({
          title: "Success",
          description: "Package deleted successfully",
        })
        setIsDeleteDialogOpen(false)
        setSelectedPackage(null)
        fetchPackages(currentPage, searchQuery)
      } else {
        throw new Error(result.message || "Failed to delete package")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete package",
        variant: "destructive",
      })
    }
  }

  // Client-side filtering for category
  const filteredPackages = packages.filter((pkg) => {
    if (categoryFilter && pkg.category !== categoryFilter) return false
    return true
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Packages</h2>
          <p className="text-sm text-muted-foreground">Manage travel packages with destinations and budgets</p>
        </div>
        {hasPermission.create && <Button onClick={() => router.push("/admin/packages/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Add Package
        </Button>}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search packages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              {packageCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          {categoryFilter && (
            <div className="flex gap-2 mt-3">
              <Badge variant="secondary" className="cursor-pointer" onClick={() => setCategoryFilter("")}>
                {packageCategories.find(c => c.id === categoryFilter)?.label} ×
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {loading && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Package Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRowSkeleton key={index} columns={5} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {!loading && filteredPackages.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {categoryFilter 
              ? "No packages found with the selected category. Try adjusting your filter."
              : "No packages found. Create your first package!"}
          </CardContent>
        </Card>
      )}

      {!loading && filteredPackages.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Image</TableHead>
                  <TableHead className="min-w-[200px]">Package Name</TableHead>
                  <TableHead className="min-w-[140px]">Category</TableHead>
                  <TableHead className="min-w-[140px]">Duration</TableHead>
                  <TableHead className="min-w-[220px]">Source → Destination</TableHead>
                  <TableHead className="min-w-[120px]">Price (Adult)</TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                  <TableHead className="text-right min-w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPackages.map((pkg) => (
                <TableRow key={pkg._id}>
                  <TableCell>
                    {pkg.images && pkg.images.length > 0 ? (
                      <img
                        src={pkg.images[0]}
                        alt={pkg.title}
                        className="h-12 w-12 rounded object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                        <MapPin className="h-4 w-4" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{pkg.title}</TableCell>
                  <TableCell>
                    {pkg.category ? (
                      <Badge variant="secondary" className={`capitalize ${packageCategories.find(c => c.id === pkg.category)?.color || "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                        {packageCategories.find(c => c.id === pkg.category)?.label || pkg.category}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3" />
                      {pkg.duration || "N/A"}
                    </div>
                  </TableCell>
                  <TableCell>
                    {pkg.source && pkg.destination ? (
                      <span className="text-sm">{pkg.source} → {pkg.destination}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {pkg.price?.adult ? (
                      <span className="text-sm font-medium">₹{pkg.price.adult.toLocaleString()}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={pkg.status === "active" ? "default" : "secondary"}>
                      {pkg.status || "active"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewPackage(pkg)}
                        title="View Package"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {hasPermission.update && <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/admin/packages/${pkg._id}?mode=edit`)}
                        title="Edit Package"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>}
                      {hasPermission.delete && <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedPackage(pkg)
                          setIsDeleteDialogOpen(true)
                        }}
                        title="Delete Package"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </CardContent>

          {totalPages > 1 && (
        <div >
          <Pagination className="flex justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
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
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
      
        </Card>
      )}

      {/* Pagination */}
    
      {/* View Package Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl">{viewPackageData?.title || "Package Details"}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-100px)] pr-4">
            {viewPackageData && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-medium">{viewPackageData.duration}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <Badge variant="secondary" className={packageCategories.find(c => c.id === viewPackageData.category)?.color}>
                      {packageCategories.find(c => c.id === viewPackageData.category)?.label || viewPackageData.category}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Source</p>
                    <p className="font-medium">{viewPackageData.source}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Destination</p>
                    <p className="font-medium">{viewPackageData.destination}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={viewPackageData.status === "active" ? "default" : "secondary"}>
                      {viewPackageData.status || "active"}
                    </Badge>
                  </div>
                  {viewPackageData.isPopular && (
                    <div>
                      <Badge variant="default">Popular Package</Badge>
                    </div>
                  )}
                </div>

                {/* Overview */}
                {viewPackageData.overview && (
                  <div>
                    <h3 className="font-semibold mb-2">Overview</h3>
                    <p className="text-sm text-muted-foreground">{viewPackageData.overview}</p>
                  </div>
                )}

                {/* Price */}
                {viewPackageData.price && (
                  <div>
                    <h3 className="font-semibold mb-3 text-lg">Pricing</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-muted rounded-lg border">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Adult</p>
                        <p className="text-2xl font-bold">₹{viewPackageData.price.adult?.toLocaleString()}</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg border">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Child</p>
                        <p className="text-2xl font-bold">₹{viewPackageData.price.child?.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Highlights */}
                {viewPackageData.highlights && viewPackageData.highlights.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 text-lg">Highlights</h3>
                    <div className="flex flex-wrap gap-2">
                      {viewPackageData.highlights.map((highlight: string) => (
                        <Badge key={highlight} variant="secondary" className="px-3 py-2 text-sm">
                          {highlight}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Inclusions */}
                {viewPackageData.inclusions && viewPackageData.inclusions.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 text-lg">Inclusions</h3>
                    <div className="flex flex-wrap gap-2">
                      {viewPackageData.inclusions.map((item: string) => (
                        <Badge key={item} variant="secondary" className="px-3 py-2 text-sm">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Exclusions */}
                {viewPackageData.exclusions && viewPackageData.exclusions.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 text-lg">Exclusions</h3>
                    <div className="flex flex-wrap gap-2">
                      {viewPackageData.exclusions.map((item: string) => (
                        <Badge key={item} variant="outline" className="px-3 py-2 text-sm">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Itinerary */}
                {viewPackageData.itinerary && viewPackageData.itinerary.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 text-lg">Itinerary</h3>
                    <div className="space-y-4">
                      {viewPackageData.itinerary.map((day: any) => (
                        <Card key={`day-${day.day}`}>
                          <CardContent className="pt-4">
                            <div className="space-y-3">
                              <div className="flex items-start gap-3">
                                <Badge variant="default" className="h-fit text-base px-3 py-1">
                                  Day {day.day}
                                </Badge>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-base">{day.title}</h4>
                                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{day.description}</p>
                                </div>
                              </div>

                              {/* Activities */}
                              {day.activities && day.activities.length > 0 && (
                                <div className="pl-16">
                                  <p className="text-xs font-medium text-muted-foreground mb-2">Activities:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {day.activities.map((activity: string) => (
                                      <Badge key={activity} variant="outline" className="text-xs">
                                        {activity}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Meals & Accommodation */}
                              <div className="pl-16 flex gap-6 text-xs">
                                {day.meals && (
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <span className="font-medium">Meals:</span>
                                    <span>{day.meals}</span>
                                  </div>
                                )}
                                {day.accommodation && (
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <span className="font-medium">Stay:</span>
                                    <span>{day.accommodation}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Images */}
                {viewPackageData.images && viewPackageData.images.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Images</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {viewPackageData.images.map((image: string) => (
                        <img
                          key={image}
                          src={image}
                          alt="Package"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the package.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePackage} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

