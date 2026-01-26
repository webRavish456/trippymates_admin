"use client"

import { useState, useEffect } from "react"
import { Search, Package } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"


interface Assignment {
  _id: string
  captainId: {
    _id: string
    name: string
    email: string
    phone: string
  }
  packageId: {
    _id: string
    title: string
    destination: string
    duration?: number
    price?: number
  }
  bookingId: {
    _id: string
    userId?: {
      name: string
      email: string
    }
    finalAmount?: number
    status?: string
    tripdate?: string
  }
  startDate: string
  endDate: string
  status: 'assigned' | 'in-progress' | 'completed' | 'cancelled'
  notes?: string
  assignedDate: string
}

import { API_BASE_URL } from "@/lib/config"

const API_BASE = `${API_BASE_URL}/api/admin/captain-assignment`
const CAPTAIN_API_BASE = `${API_BASE_URL}/api/admin/captain`
const PACKAGE_API_BASE = `${API_BASE_URL}/api/admin/packages`

type CaptainPermission = {
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

export function CaptainAssignmentTab() {



  const router = useRouter()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCaptain, setFilterCaptain] = useState("all")
  const [filterPackage, setFilterPackage] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [captains, setCaptains] = useState<any[]>([])
  const [packages, setPackages] = useState<any[]>([])
  const [captainStats, setCaptainStats] = useState<Record<string, number>>({})
  const { toast } = useToast()





  useEffect(() => {
    fetchAssignments()
    fetchCaptains()
    fetchPackages()
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchAssignments(1, filterCaptain, filterPackage, filterStatus)
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [filterCaptain, filterPackage, filterStatus])

  const fetchCaptains = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${CAPTAIN_API_BASE}/all?limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.status) {
        setCaptains(data.data.captains || [])
      }
    } catch (error) {
      console.error("Failed to fetch captains:", error)
    }
  }

  const fetchPackages = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${PACKAGE_API_BASE}/showPackage?limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.status) {
        setPackages(data.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch packages:", error)
    }
  }

  const fetchAssignments = async (page = 1, captainId = "", packageId = "", status = "") => {
    try {
      setLoading(true)
      const token = localStorage.getItem('adminToken')
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      })
      if (captainId && captainId !== "all") params.append('captainId', captainId)
      if (packageId && packageId !== "all") params.append('packageId', packageId)
      if (status && status !== "all") params.append('status', status)
      
      const response = await fetch(`${API_BASE}/all?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      
      if (data.status) {
        let filteredAssignments = data.data.assignments || []
        if (searchQuery) {
          filteredAssignments = filteredAssignments.filter((a: Assignment) => 
            a.captainId.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.packageId.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.bookingId?._id?.toLowerCase().includes(searchQuery.toLowerCase())
          )
        }
        setAssignments(filteredAssignments)
        
        // Calculate captain booking statistics
        const stats: Record<string, number> = {}
        filteredAssignments.forEach((assignment: Assignment) => {
          const captainId = assignment.captainId._id
          stats[captainId] = (stats[captainId] || 0) + 1
        })
        setCaptainStats(stats)
        
        if (data.data.pagination) {
          setCurrentPage(data.data.pagination.page)
          setTotalPages(data.data.pagination.pages)
        }
      } else {
        throw new Error(data.message || "Failed to fetch assignments")
      }
    } catch (error: any) {
      console.error("Fetch error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to fetch assignments",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchAssignments(page, filterCaptain, filterPackage, filterStatus)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      assigned: "outline",
      'in-progress': "default",
      completed: "secondary",
      cancelled: "destructive"
    }
    return (
      <Badge variant={variants[status] || "default"}>
        {status === 'in-progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Captain Assignment Management</h2>
        <p className="text-sm text-muted-foreground">View and manage captain assignments from bookings</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-6 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by captain, package, or booking ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCaptain} onValueChange={setFilterCaptain}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Captain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Captains</SelectItem>
                {captains.filter(captain => captain._id && captain._id.trim() !== "").map((captain) => (
                  <SelectItem key={captain._id} value={captain._id}>
                    {captain.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterPackage} onValueChange={setFilterPackage}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Package" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Packages</SelectItem>
                {packages.filter(pkg => pkg._id && pkg._id.trim() !== "").map((pkg) => (
                  <SelectItem key={pkg._id} value={pkg._id}>
                    {pkg.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading assignments...</div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No assignments found</div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking ID</TableHead>
                      <TableHead>Captain</TableHead>
                      <TableHead>Package Details</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Booking Count</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((assignment) => (
                      <TableRow key={assignment._id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">#{assignment.bookingId?._id?.slice(-8) || 'N/A'}</p>
                            {assignment.bookingId?.finalAmount && (
                              <p className="text-xs text-muted-foreground">
                                ₹{assignment.bookingId.finalAmount}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{assignment.captainId.name}</p>
                            <p className="text-sm text-muted-foreground">{assignment.captainId.email}</p>
                            <p className="text-xs text-muted-foreground">{assignment.captainId.phone}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{assignment.packageId?.title || 'N/A'}</p>
                            <p className="text-sm text-muted-foreground">
                              {assignment.packageId?.destination || 'N/A'}
                            </p>
                            {assignment.packageId?.duration && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Duration: {assignment.packageId.duration} days
                              </p>
                            )}
                            {assignment.packageId?.price && (
                              <p className="text-xs text-muted-foreground">
                                Price: ₹{assignment.packageId.price}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {assignment.bookingId?.userId ? (
                            <div>
                              <p className="font-medium text-sm">{assignment.bookingId.userId.name}</p>
                              <p className="text-xs text-muted-foreground">{assignment.bookingId.userId.email}</p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(assignment.startDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(assignment.endDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {captainStats[assignment.captainId._id] || 0} bookings
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/admin/bookings`)}
                              title="View Booking"
                            >
                              <Package className="h-4 w-4" />
                            </Button>
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

    </div>
  )
}

