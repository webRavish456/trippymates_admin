"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Edit, Trash2, Star, Eye } from "lucide-react"
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
import { useSelector } from "react-redux"
import { RootState } from "@/components/redux/store"

interface Captain {
  _id: string
  name: string
  email: string
  phone: string
  address?: string
  experience?: number
  specialization: string[]
  languages: string[]
  rating?: number
  image?: string
  bio?: string
  status: 'active' | 'inactive' | 'on-leave'
  createdAt: string
}

type Permission = {
  module: string;
  create: boolean;
  read?: boolean;
  update?: boolean;
  delete?: boolean;
};

type CaptainPermission = {
  create: boolean;
  update: boolean;
  delete: boolean;
};

const API_BASE = `${API_BASE_URL}/api/admin/captain`

export function CaptainDetailsTab() {

  const permissions = useSelector(
    (state: RootState) => state.permission.permissions
  )

  const router = useRouter()
  const [captains, setCaptains] = useState<Captain[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCaptain, setSelectedCaptain] = useState<Captain | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { toast } = useToast()

  const [hasPermission, setHasPermission] = useState<CaptainPermission>({
    create: false,
    update: false,
    delete: false,
  });

  useEffect(() => {
    const captainPermission = permissions.find(
      (p: Permission) => p.module === "captain_details"
    );
  
    setHasPermission({
      create: captainPermission?.create ?? false,
      update: captainPermission?.update ?? false,
      delete: captainPermission?.delete ?? false,
    });
  }, []);
  
  useEffect(() => {
    const delay = searchQuery ? 500 : 0
    const timeoutId = setTimeout(() => {
      fetchCaptains(currentPage, searchQuery)
    }, delay)
    return () => clearTimeout(timeoutId)
  }, [currentPage, searchQuery])

  const fetchCaptains = async (page = 1, search = "") => {
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
        let filteredCaptains = data.data.captains || []
        if (search) {
          filteredCaptains = filteredCaptains.filter((c: Captain) =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.email.toLowerCase().includes(search.toLowerCase()) ||
            c.phone.includes(search)
          )
        }
        setCaptains(filteredCaptains)
        if (data.data.pagination) {
          setCurrentPage(data.data.pagination.page)
          setTotalPages(data.data.pagination.pages)
        }
      } else {
        throw new Error(data.message || "Failed to fetch captains")
      }
    } catch (error: any) {
      console.error("Fetch error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to fetch captains",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleDeleteCaptain = async () => {
    if (!selectedCaptain) return

    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${API_BASE}/delete/${selectedCaptain._id}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()

      if (result.status) {
        toast({
          title: "Success",
          description: "Captain deleted successfully",
        })
        setIsDeleteDialogOpen(false)
        setSelectedCaptain(null)
        fetchCaptains(currentPage, searchQuery)
      } else {
        throw new Error(result.message || "Failed to delete captain")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete captain",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      inactive: "secondary",
      'on-leave': "outline"
    }
    return (
      <Badge variant={variants[status] || "default"}>
        {status === 'on-leave' ? 'On Leave' : status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Captain Details</h2>
          <p className="text-sm text-muted-foreground">View and manage all captains</p>
        </div>
       {hasPermission.create &&  <Button onClick={() => router.push("/admin/captain/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Add Captain
        </Button>}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search captains by name, email, or phone..."
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
                    <TableHead>Captain</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Specialization</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <TableRowSkeleton key={`captain-skeleton-${index}`} columns={7} />
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : captains.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No captains found</div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Experience</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {captains.map((captain) => (
                      <TableRow key={captain._id}>
                        <TableCell className="font-medium">{captain.name}</TableCell>
                        <TableCell>{captain.email}</TableCell>
                        <TableCell>{captain.phone}</TableCell>
                        <TableCell>{captain.experience !== undefined && captain.experience !== null ? `${captain.experience} years` : '-'}</TableCell>
                        <TableCell>
                          {captain.rating !== undefined && captain.rating !== null ? (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              {captain.rating.toFixed(1)}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(captain.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/admin/captain/${captain._id}?mode=view`)}
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                           {hasPermission.update && <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/admin/captain/${captain._id}?mode=edit`)}
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>}
                            {hasPermission.delete && 
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedCaptain(captain)
                                setIsDeleteDialogOpen(true)
                              }}
                              title="Delete"
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
            <AlertDialogTitle>Delete Captain</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedCaptain?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCaptain} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

