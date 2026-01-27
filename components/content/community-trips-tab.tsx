"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, Edit, Trash2, Calendar, User, MapPin, Users, Star, CheckCircle2, MessageSquare, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { API_BASE_URL } from "@/lib/config"
import { CardSkeleton } from "@/components/ui/skeletons"
import { RootState } from "../redux/store"
import { useSelector } from "react-redux"

interface CommunityTrip {
  _id: string
  title: string
  description: string
  startDate: string
  endDate: string
  location: string
  tripType: string
  groupType?: string
  maxMembers: number
  images: Array<{
    filename: string
    path: string
    publicId?: string
  }>
  organizerName?: string
  organizerImage?: {
    filename: string
    path: string
    publicId?: string
  }
  organizerRating?: number
  organizerVerified?: boolean
  averageRating?: number
  totalRatings?: number
  members: Array<{
    userId: string
    joinedAt: string
    status: string
  }>
  status: "upcoming" | "ongoing" | "completed" | "cancelled"
  price: number
  currency: string
  createdAt: string
}

type CommunityTripsPermission = {
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

export function CommunityTripsTab() {

  const permissions = useSelector(
    (state: RootState) => state.permission.permissions
  )
  const [hasPermission, setHasPermission] = useState<CommunityTripsPermission>({
    create: false,
    update: false,
    delete: false,
  })  
  const router = useRouter()
  const [trips, setTrips] = useState<CommunityTrip[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [tripToDelete, setTripToDelete] = useState<string | null>(null)
  const [selectedTrip, setSelectedTrip] = useState<CommunityTrip | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [tripImageFile, setTripImageFile] = useState<File | null>(null)
  const [tripImagePreview, setTripImagePreview] = useState("")
  const [organizerImageFile, setOrganizerImageFile] = useState<File | null>(null)
  const [organizerImagePreview, setOrganizerImagePreview] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    location: "",
    tripType: "other",
    groupType: "Mixed Group",
    maxMembers: 20,
    organizerName: "",
    status: "upcoming" as "upcoming" | "ongoing" | "completed" | "cancelled",
  })

  useEffect(() => {
    fetchTrips()
  }, [currentPage, statusFilter])

  useEffect(() => {
    // Debounce search query
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        fetchTrips()
      } else {
        setCurrentPage(1)
      }
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  useEffect(() => {
    const communityTripsPermission = permissions.find(
      (p: Permission) => p.module === "community_trips"
    )
    setHasPermission({
      create: communityTripsPermission?.create ?? false,
      update: communityTripsPermission?.update ?? false,
      delete: communityTripsPermission?.delete ?? false,
    })
  }, [])

  const fetchTrips = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('adminToken')
      const params: any = {
        page: currentPage.toString(),
        limit: "10",
      }
      
      if (statusFilter !== "all") {
        params.status = statusFilter
      }

      const queryString = new URLSearchParams(params).toString()
      const response = await fetch(`${API_BASE_URL}/api/admin/community-trip/all?${queryString}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const result = await response.json()

      if (result.status) {
        // Filter by search query on client side
        let filteredTrips = result.data || []
        if (searchQuery) {
          filteredTrips = filteredTrips.filter((trip: CommunityTrip) =>
            trip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            trip.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
            trip.organizerName?.toLowerCase().includes(searchQuery.toLowerCase())
          )
        }
        setTrips(filteredTrips)
        setTotalPages(result.pagination?.totalPages || 1)
      }
    } catch (error) {
      console.error("Fetch error:", error)
      toast({
        title: "Error",
        description: "Failed to fetch community trips",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTripImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setTripImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setTripImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleOrganizerImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setOrganizerImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setOrganizerImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      location: "",
      tripType: "other",
      groupType: "Mixed Group",
      maxMembers: 20,
      organizerName: "",
      status: "upcoming",
    })
    setTripImageFile(null)
    setTripImagePreview("")
    setOrganizerImageFile(null)
    setOrganizerImagePreview("")
  }

  const handleAddTrip = async () => {
    if (isSubmitting) return
    
    if (!formData.title || !formData.description || !formData.startDate || !formData.endDate || !formData.location) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      const token = localStorage.getItem('adminToken')
      const formDataToSend = new FormData()
      formDataToSend.append("title", formData.title)
      formDataToSend.append("description", formData.description)
      formDataToSend.append("startDate", formData.startDate)
      formDataToSend.append("endDate", formData.endDate)
      formDataToSend.append("location", formData.location)
      formDataToSend.append("tripType", formData.tripType)
      formDataToSend.append("groupType", formData.groupType)
      formDataToSend.append("maxMembers", formData.maxMembers.toString())
      formDataToSend.append("organizerName", formData.organizerName)

      // Auto status: same day => ongoing, otherwise upcoming
      const today = new Date()
      const start = new Date(formData.startDate)
      const isSameDay =
        today.getFullYear() === start.getFullYear() &&
        today.getMonth() === start.getMonth() &&
        today.getDate() === start.getDate()
      const computedStatus: "upcoming" | "ongoing" = isSameDay ? "ongoing" : "upcoming"
      formDataToSend.append("status", computedStatus)
      
      if (tripImageFile) {
        formDataToSend.append("images", tripImageFile)
      }
      if (organizerImageFile) {
        formDataToSend.append("organizerImage", organizerImageFile)
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/community-trip/create`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend,
      })

      const result = await response.json()

      if (result.status) {
        toast({
          title: "Success",
          description: "Community trip created successfully",
        })
        resetForm()
        setIsAddDialogOpen(false)
        fetchTrips()
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to create trip",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Add error:", error)
      toast({
        title: "Error",
        description: "Failed to create trip",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditTrip = async () => {
    if (isSubmitting || !selectedTrip) return
    
    if (!formData.title || !formData.description || !formData.startDate || !formData.endDate || !formData.location) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      const token = localStorage.getItem('adminToken')
      const formDataToSend = new FormData()
      formDataToSend.append("title", formData.title)
      formDataToSend.append("description", formData.description)
      formDataToSend.append("startDate", formData.startDate)
      formDataToSend.append("endDate", formData.endDate)
      formDataToSend.append("location", formData.location)
      formDataToSend.append("tripType", formData.tripType)
      formDataToSend.append("groupType", formData.groupType || "Mixed Group")
      formDataToSend.append("maxMembers", formData.maxMembers.toString())
      formDataToSend.append("organizerName", formData.organizerName || "")
      formDataToSend.append("status", formData.status)
      
      // Debug: Log formData to check groupType
      console.log("Updating trip with groupType:", formData.groupType)
      
      if (tripImageFile) {
        formDataToSend.append("images", tripImageFile)
      }
      if (organizerImageFile) {
        formDataToSend.append("organizerImage", organizerImageFile)
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/community-trip/update/${selectedTrip._id}`, {
        method: "PUT",
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend,
      })

      const result = await response.json()

      if (result.status) {
        toast({
          title: "Success",
          description: "Community trip updated successfully",
        })
        resetForm()
        setIsEditDialogOpen(false)
        setSelectedTrip(null)
        fetchTrips()
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to update trip",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Update error:", error)
      toast({
        title: "Error",
        description: "Failed to update trip",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = (id: string) => {
    setTripToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteTrip = async () => {
    if (!tripToDelete) return

    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${API_BASE_URL}/api/admin/community-trip/delete/${tripToDelete}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`
        },
      })

      const result = await response.json()

      if (result.status) {
        toast({
          title: "Success",
          description: "Trip deleted successfully",
        })
        setIsDeleteDialogOpen(false)
        setTripToDelete(null)
        fetchTrips()
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to delete trip",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Delete error:", error)
      toast({
        title: "Error",
        description: "Failed to delete trip",
        variant: "destructive",
      })
    } finally {
      setIsDeleteDialogOpen(false)
      setTripToDelete(null)
    }
  }

  const handleViewTrip = (trip: CommunityTrip) => {
    setSelectedTrip(trip)
    setIsViewDialogOpen(true)
  }

  const handleEditClick = (trip: CommunityTrip) => {
    setSelectedTrip(trip)
    setFormData({
      title: trip.title,
      description: trip.description,
      startDate: trip.startDate ? new Date(trip.startDate).toISOString().slice(0, 16) : "",
      endDate: trip.endDate ? new Date(trip.endDate).toISOString().slice(0, 16) : "",
      location: trip.location,
      tripType: trip.tripType || "other",
      groupType: trip.groupType || "Mixed Group",
      maxMembers: trip.maxMembers || 20,
      organizerName: trip.organizerName || "",
      status: trip.status,
    })
    setTripImagePreview(trip.images?.[0]?.path || "")
    setOrganizerImagePreview(trip.organizerImage?.path || "")
    setIsEditDialogOpen(true)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatDateRange = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return "N/A"
    const start = new Date(startDate)
    const end = new Date(endDate)
    return `${start.getDate()} - ${end.getDate()} ${end.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      upcoming: { label: "Upcoming", variant: "default" },
      ongoing: { label: "Ongoing", variant: "secondary" },
      completed: { label: "Completed", variant: "outline" },
      cancelled: { label: "Cancelled", variant: "destructive" },
    }
    const statusInfo = statusMap[status] || { label: status, variant: "outline" }
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  const getTripTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      adventure: "Adventure",
      beach: "Beach",
      cultural: "Cultural",
      nature: "Nature",
      festival: "Festival",
      relaxation: "Relaxation",
      other: "Other",
    }
    return typeMap[type] || type
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Communities</CardTitle>
            {hasPermission.create && <Button
              onClick={() => {
                resetForm()
                setIsAddDialogOpen(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Community Trip
            </Button>}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search trips by title or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <CardSkeleton key={`community-trip-skeleton-${index}`} />
          ))}
        </div>
      ) : trips.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No trips found. Create your first community trip!
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="relative overflow-auto max-h-[calc(100vh-300px)]">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-20 bg-background border-b shadow-sm">
                  <tr>
                    <th className="text-left p-4 font-medium whitespace-nowrap bg-background">Community Name</th>
                    <th className="text-left p-4 font-medium whitespace-nowrap bg-background">Destination</th>
                    <th className="text-left p-4 font-medium whitespace-nowrap bg-background">Dates</th>
                    <th className="text-left p-4 font-medium whitespace-nowrap bg-background">Organizer</th>
                    <th className="text-left p-4 font-medium whitespace-nowrap bg-background">Members</th>
                    <th className="text-left p-4 font-medium whitespace-nowrap bg-background">Type</th>
                    <th className="text-left p-4 font-medium whitespace-nowrap bg-background">Status</th>
                    <th className="text-left p-4 font-medium whitespace-nowrap bg-background">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trips.map((trip) => (
                    <tr key={trip._id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4 min-w-[250px]">
                        <div className="font-medium">{trip.title}</div>
                        <div className="text-sm text-muted-foreground line-clamp-2 max-w-xs">
                          {trip.description}
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span>{trip.location}</span>
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
                        </div>
                      </td>
                      <td className="p-4 min-w-[200px]">
                        <div className="flex items-center gap-2">
                          {trip.organizerImage?.path ? (
                            <img
                              src={trip.organizerImage.path}
                              alt={trip.organizerName}
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                              <User className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-sm truncate">
                                {trip.organizerName && (trip.organizerName.toLowerCase().includes('superadmin') || trip.organizerName.includes('@')) 
                                  ? "Admin" 
                                  : trip.organizerName || "N/A"}
                              </span>
                           
                            </div>
                            {((trip.averageRating && trip.averageRating > 0) || (trip.organizerRating && trip.organizerRating > 0)) && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                              <span>{(trip.averageRating || trip.organizerRating || 0).toFixed(1)}</span>
                            </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span>{trip.members?.length || 0} / {trip.maxMembers}</span>
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <Badge variant="outline">{getTripTypeLabel(trip.tripType)}</Badge>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {getStatusBadge(trip.status)}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              router.push(`/admin/community-trips/${trip._id}`)
                              window.scrollTo({ top: 0, behavior: 'instant' })
                            }}
                            title="Open chat"
                            className="text-primary hover:text-primary hover:bg-primary/10"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewTrip(trip)}
                            title="View trip details"
                            className="hover:bg-muted"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                         {hasPermission.update && <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(trip)}
                            title="Edit trip"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          }
                          {hasPermission.delete && <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(trip._id)}
                            title="Delete trip"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                          }
                        </div>
                      </td>
                    </tr> 
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages >= 1 && (
              <div className="flex items-center justify-end gap-2 pt-4 border-t px-4 pb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open)
        if (!open) resetForm()
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Community Trip</DialogTitle>
            <DialogDescription>
              Create a new community trip for travelers to join
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="title">Trip Title *</Label>
                <div className="mt-2">
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Goa Beach Adventure"
                  />
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="description">Description *</Label>
                <div className="mt-2">
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Tell us about your trip..."
                    rows={4}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="groupType">Group Type</Label>
                <div className="mt-2">
                  <Select value={formData.groupType} onValueChange={(value) => setFormData({ ...formData, groupType: value })}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mixed Group">Mixed Group</SelectItem>
                      <SelectItem value="Adventure">Adventure</SelectItem>
                      <SelectItem value="Heritage">Heritage</SelectItem>
                      <SelectItem value="Solo">Solo</SelectItem>
                      <SelectItem value="Nature">Nature</SelectItem>
                      <SelectItem value="Party">Party</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tripType">Trip Type</Label>
                <div className="mt-2">
                  <Select value={formData.tripType} onValueChange={(value) => setFormData({ ...formData, tripType: value })}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="adventure">Adventure</SelectItem>
                      <SelectItem value="beach">Beach</SelectItem>
                      <SelectItem value="cultural">Cultural</SelectItem>
                      <SelectItem value="nature">Nature</SelectItem>
                      <SelectItem value="festival">Festival</SelectItem>
                      <SelectItem value="relaxation">Relaxation</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <div className="mt-2">
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <div className="mt-2">
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxMembers">Max Members</Label>
                <div className="mt-2">
                  <Input
                    id="maxMembers"
                    type="number"
                    value={formData.maxMembers}
                    onChange={(e) => setFormData({ ...formData, maxMembers: parseInt(e.target.value) || 20 })}
                    min={1}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Destination *</Label>
                <div className="mt-2">
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Goa, India"
                  />
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="tripImage">Trip Image</Label>
                <div className="mt-2">
                {tripImagePreview ? (
                  <div className="mt-2 relative">
                    <img src={tripImagePreview} alt="Trip preview" className="w-full h-48 object-cover rounded-md" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setTripImageFile(null)
                        setTripImagePreview("")
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <Input
                    id="tripImage"
                    type="file"
                    accept="image/*"
                    onChange={handleTripImageChange}
                  />
                )}
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="organizerName">Organizer Name</Label>
                <div className="mt-2">
                  <Input
                    id="organizerName"
                    value={formData.organizerName}
                    onChange={(e) => setFormData({ ...formData, organizerName: e.target.value })}
                    placeholder="Organizer name"
                  />
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="organizerImage">Organizer Image</Label>
                <div className="mt-2">
                {organizerImagePreview ? (
                  <div className="mt-2 relative">
                    <img src={organizerImagePreview} alt="Organizer preview" className="w-32 h-32 object-cover rounded-full" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setOrganizerImageFile(null)
                        setOrganizerImagePreview("")
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <Input
                    id="organizerImage"
                    type="file"
                    accept="image/*"
                    onChange={handleOrganizerImageChange}
                  />
                )}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddDialogOpen(false)
              resetForm()
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddTrip} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Trip"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open)
        if (!open) {
          resetForm()
          setSelectedTrip(null)
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Community Trip</DialogTitle>
            <DialogDescription>
              Update the community trip details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="edit-title">Trip Title *</Label>
                <div className="mt-2">
                  <Input
                    id="edit-title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Goa Beach Adventure"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="edit-description">Description *</Label>
                <div className="mt-2">
                  <Textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Tell us about your trip..."
                    rows={4}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-groupType">Group Type</Label>
                <div className="mt-2">
                  <Select 
                    value={formData.groupType || "Mixed Group"} 
                    onValueChange={(value) => {
                      console.log("Group Type changed to:", value)
                      setFormData({ ...formData, groupType: value })
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Group Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mixed Group">Mixed Group</SelectItem>
                      <SelectItem value="Adventure">Adventure</SelectItem>
                      <SelectItem value="Heritage">Heritage</SelectItem>
                      <SelectItem value="Solo">Solo</SelectItem>
                      <SelectItem value="Nature">Nature</SelectItem>
                      <SelectItem value="Party">Party</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-tripType">Trip Type</Label>
                <div className="mt-2">
                  <Select value={formData.tripType} onValueChange={(value) => setFormData({ ...formData, tripType: value })}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="adventure">Adventure</SelectItem>
                      <SelectItem value="beach">Beach</SelectItem>
                      <SelectItem value="cultural">Cultural</SelectItem>
                      <SelectItem value="nature">Nature</SelectItem>
                      <SelectItem value="festival">Festival</SelectItem>
                      <SelectItem value="relaxation">Relaxation</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-startDate">Start Date *</Label>
                <div className="mt-2">
                  <Input
                    id="edit-startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-endDate">End Date *</Label>
                <div className="mt-2">
                  <Input
                    id="edit-endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-maxMembers">Max Members</Label>
                <div className="mt-2">
                  <Input
                    id="edit-maxMembers"
                    type="number"
                    value={formData.maxMembers}
                    onChange={(e) => setFormData({ ...formData, maxMembers: parseInt(e.target.value) || 20 })}
                    min={1}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-location">Destination *</Label>
                <div className="mt-2">
                  <Input
                    id="edit-location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Goa, India"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <div className="mt-2">
                  <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-organizerName">Organizer Name</Label>
                <div className="mt-2">
                  <Input
                    id="edit-organizerName"
                    value={formData.organizerName}
                    onChange={(e) => setFormData({ ...formData, organizerName: e.target.value })}
                    placeholder="Organizer name"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="edit-tripImage">Trip Image</Label>
                <div className="mt-2">
                  {tripImagePreview ? (
                    <div className="relative">
                      <img src={tripImagePreview} alt="Trip preview" className="w-full h-48 object-cover rounded-md" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setTripImageFile(null)
                          setTripImagePreview("")
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <Input
                      id="edit-tripImage"
                      type="file"
                      accept="image/*"
                      onChange={handleTripImageChange}
                    />
                  )}
                </div>
              </div>
            
              <div className="md:col-span-2">
                <Label htmlFor="edit-organizerImage">Organizer Image</Label>
                <div className="mt-2">
                  {organizerImagePreview ? (
                    <div className="relative">
                      <img src={organizerImagePreview} alt="Organizer preview" className="w-32 h-32 object-cover rounded-full" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setOrganizerImageFile(null)
                          setOrganizerImagePreview("")
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <Input
                      id="edit-organizerImage"
                      type="file"
                      accept="image/*"
                      onChange={handleOrganizerImageChange}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false)
              resetForm()
              setSelectedTrip(null)
            }}>
              Cancel
            </Button>
            <Button onClick={handleEditTrip} disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Trip"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTrip?.title}</DialogTitle>
            <DialogDescription>
              View community trip details
            </DialogDescription>
          </DialogHeader>
          {selectedTrip && (
            <div className="space-y-4">
              {selectedTrip.images?.[0]?.path && (
                <img
                  src={selectedTrip.images[0].path}
                  alt={selectedTrip.title}
                  className="w-full h-64 object-cover rounded-md"
                />
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Destination</Label>
                  <p className="font-medium mt-1">{selectedTrip.location}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Trip Type</Label>
                  <p className="font-medium mt-1">{getTripTypeLabel(selectedTrip.tripType)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Group Type</Label>
                  <p className="font-medium mt-1">{selectedTrip.groupType || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Start Date</Label>
                  <p className="font-medium mt-1">{formatDate(selectedTrip.startDate)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">End Date</Label>
                  <p className="font-medium mt-1">{formatDate(selectedTrip.endDate)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Members</Label>
                  <p className="font-medium mt-1">{selectedTrip.members?.length || 0} / {selectedTrip.maxMembers}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedTrip.status)}</div>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="mt-1">{selectedTrip.description}</p>
              </div>
              {selectedTrip.organizerName && (
                <div>
                  <Label className="text-muted-foreground">Organizer</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedTrip.organizerImage?.path && (
                      <img
                        src={selectedTrip.organizerImage.path}
                        alt={selectedTrip.organizerName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">
                          {selectedTrip.organizerName && (selectedTrip.organizerName.toLowerCase().includes('superadmin') || selectedTrip.organizerName.includes('@')) 
                            ? "Admin" 
                            : selectedTrip.organizerName}
                        </span>
                        {selectedTrip.organizerVerified && (
                          <CheckCircle2 className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                      {((selectedTrip.averageRating && selectedTrip.averageRating > 0) || (selectedTrip.organizerRating && selectedTrip.organizerRating > 0)) && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>{(selectedTrip.averageRating || selectedTrip.organizerRating || 0).toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Community Trip</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this trip? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteDialogOpen(false)
              setTripToDelete(null)
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTrip}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

