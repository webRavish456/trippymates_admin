"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Edit, Trash2, Eye, Star, User, MapPin, Package } from "lucide-react"
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

interface Testimonial {
  _id: string
  customerName: string
  customerEmail: string
  customerImage?: string
  rating: number
  title: string
  testimonial: string
  tripPackage?: string
  location?: string
  status: "pending" | "approved" | "rejected"
  createdAt: string
}

type TestimonialsPermission = {
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

export function TestimonialsTab() {
  const permissions = useSelector(
    (state: RootState) => state.permission.permissions
  )
  const [hasPermission, setHasPermission] = useState<TestimonialsPermission>({
    create: false,
    update: false,
    delete: false,
  })
 
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [testimonialToDelete, setTestimonialToDelete] = useState<string | null>(null)
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    rating: 5,
    title: "",
    testimonial: "",
    tripPackage: "",
    location: "",
    status: "pending" as "pending" | "approved" | "rejected",
  })

  useEffect(() => {
    fetchTestimonials()
  }, [currentPage, searchQuery, statusFilter])

  useEffect(() => {
    const testimonialsPermission = permissions.find(
      (p: Permission) => p.module === "content"
    )
    setHasPermission({
      create: testimonialsPermission?.create ?? false,
      update: testimonialsPermission?.update ?? false,
      delete: testimonialsPermission?.delete ?? false,
    })
  }, [])

  const fetchTestimonials = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('adminToken')
      const params: any = {
        page: currentPage.toString(),
        limit: "10",
      }
      
      if (searchQuery) {
        params.search = searchQuery
      }
      if (statusFilter !== "all") {
        params.status = statusFilter
      }

      const queryString = new URLSearchParams(params).toString()
      const response = await fetch(`${API_BASE_URL}/api/admin/getAllTestimonials?${queryString}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const result = await response.json()

      if (result.status) {
        setTestimonials(result.data || [])
        setTotalPages(result.pagination?.totalPages || 1)
      }
    } catch (error) {
      console.error("Fetch error:", error)
      toast({
        title: "Error",
        description: "Failed to fetch testimonials",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddTestimonial = async () => {
    if (isSubmitting) return
    
    if (!formData.customerName || !formData.customerEmail || !formData.title || !formData.testimonial) {
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
      formDataToSend.append("customerName", formData.customerName)
      formDataToSend.append("customerEmail", formData.customerEmail)
      formDataToSend.append("rating", formData.rating.toString())
      formDataToSend.append("title", formData.title)
      formDataToSend.append("testimonial", formData.testimonial)
      formDataToSend.append("tripPackage", formData.tripPackage)
      formDataToSend.append("location", formData.location)
      formDataToSend.append("status", formData.status)
      
      if (imageFile) {
        formDataToSend.append("customerImage", imageFile)
      }

      const response = await fetch("${API_BASE_URL}/api/admin/addTestimonial", {
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
          description: "Testimonial created successfully",
        })
        setIsAddDialogOpen(false)
        resetForm()
        fetchTestimonials()
      } else {
        throw new Error(result.message || "Failed to create testimonial")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create testimonial",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateTestimonial = async () => {
    if (!selectedTestimonial || isSubmitting) return

    try {
      setIsSubmitting(true)
      const token = localStorage.getItem('adminToken')
      const formDataToSend = new FormData()
      formDataToSend.append("customerName", formData.customerName)
      formDataToSend.append("customerEmail", formData.customerEmail)
      formDataToSend.append("rating", formData.rating.toString())
      formDataToSend.append("title", formData.title)
      formDataToSend.append("testimonial", formData.testimonial)
      formDataToSend.append("tripPackage", formData.tripPackage)
      formDataToSend.append("location", formData.location)
      formDataToSend.append("status", formData.status)
      
      if (imageFile) {
        formDataToSend.append("customerImage", imageFile)
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/updateTestimonial/${selectedTestimonial._id}`, {
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
          description: "Testimonial updated successfully",
        })
        setIsEditDialogOpen(false)
        resetForm()
        fetchTestimonials()
      } else {
        throw new Error(result.message || "Failed to update testimonial")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update testimonial",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = (id: string) => {
    setTestimonialToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteTestimonial = async () => {
    if (!testimonialToDelete) return

    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${API_BASE_URL}/api/admin/deleteTestimonial/${testimonialToDelete}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()

      if (result.status) {
        toast({
          title: "Success",
          description: "Testimonial deleted successfully",
        })
        setIsDeleteDialogOpen(false)
        setTestimonialToDelete(null)
        fetchTestimonials()
      } else {
        throw new Error(result.message || "Failed to delete testimonial")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete testimonial",
        variant: "destructive",
      })
    } finally {
      setIsDeleteDialogOpen(false)
      setTestimonialToDelete(null)
    }
  }

  const openEditDialog = (testimonial: Testimonial) => {
    setSelectedTestimonial(testimonial)
    setFormData({
      customerName: testimonial.customerName,
      customerEmail: testimonial.customerEmail,
      rating: testimonial.rating,
      title: testimonial.title || "",
      testimonial: testimonial.testimonial,
      tripPackage: testimonial.tripPackage || "",
      location: testimonial.location || "",
      status: testimonial.status,
    })
    setImagePreview(testimonial.customerImage || "")
    setIsEditDialogOpen(true)
  }

  const openViewDialog = (testimonial: Testimonial) => {
    setSelectedTestimonial(testimonial)
    setIsViewDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      customerName: "",
      customerEmail: "",
      rating: 5,
      title: "",
      testimonial: "",
      tripPackage: "",
      location: "",
      status: "pending",
    })
    setImageFile(null)
    setImagePreview("")
    setSelectedTestimonial(null)
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
      />
    ))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Testimonials</h2>
          <p className="text-sm text-muted-foreground">Manage customer testimonials</p>
        </div>
        {hasPermission.create && <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Testimonial
        </Button>}  
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search testimonials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <CardSkeleton key={`testimonial-skeleton-${index}`} />
          ))}
        </div>
      ) : testimonials.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No testimonials found. Create your first testimonial!
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium">Customer</th>
                    <th className="text-left p-4 font-medium">Rating</th>
                    <th className="text-left p-4 font-medium">Title</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {testimonials.map((testimonial) => (
                    <tr key={testimonial._id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {testimonial.customerImage ? (
                            <img 
                              src={testimonial.customerImage} 
                              alt={testimonial.customerName} 
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                              <User className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{testimonial.customerName}</div>
                            <div className="text-sm text-muted-foreground">{testimonial.customerEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          {renderStars(testimonial.rating)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="max-w-xs truncate font-medium">{testimonial.title || "No title"}</div>
                      </td>
                      <td className="p-4">
                        <Badge 
                          variant={
                            testimonial.status === "approved" ? "default" : 
                            testimonial.status === "rejected" ? "destructive" : 
                            "secondary"
                          }
                        >
                          {testimonial.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openViewDialog(testimonial)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {hasPermission.update && <Button variant="ghost" size="sm" onClick={() => openEditDialog(testimonial)}>
                            <Edit className="h-4 w-4" />
                          </Button>}
                          {hasPermission.delete && <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(testimonial._id)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>}
                         
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages >= 1 && (
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4">
                  Page {currentPage} of {totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages || 1, p + 1))}
                  disabled={currentPage >= (totalPages || 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Dialog */}
      <Dialog 
        open={isAddDialogOpen} 
        onOpenChange={(open) => {
          setIsAddDialogOpen(open)
          if (open) {
            resetForm()
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Testimonial</DialogTitle>
            <DialogDescription>Create a new customer testimonial</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerEmail">Customer Email *</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter testimonial title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="testimonial">Testimonial (Description) *</Label>
              <Textarea
                id="testimonial"
                rows={4}
                value={formData.testimonial}
                onChange={(e) => setFormData({ ...formData, testimonial: e.target.value })}
                placeholder="Enter testimonial description"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4">
              <div className="md:col-span-6 space-y-2">
                <Label htmlFor="rating">Rating *</Label>
                <Select
                  value={formData.rating.toString()}
                  onValueChange={(value) => setFormData({ ...formData, rating: parseInt(value) })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 Stars</SelectItem>
                    <SelectItem value="4">4 Stars</SelectItem>
                    <SelectItem value="3">3 Stars</SelectItem>
                    <SelectItem value="2">2 Stars</SelectItem>
                    <SelectItem value="1">1 Star</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tripPackage">Trip Package</Label>
                <Input
                  id="tripPackage"
                  value={formData.tripPackage}
                  onChange={(e) => setFormData({ ...formData, tripPackage: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerImage">Customer Image</Label>
              <Input id="customerImage" type="file" accept="image/*" onChange={handleImageChange} />
              {imagePreview && (
                <img src={imagePreview} alt="Preview" className="mt-2 w-24 h-24 rounded-full object-cover" />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleAddTestimonial} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Testimonial"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog 
        open={isEditDialogOpen} 
        onOpenChange={(open) => {
          setIsEditDialogOpen(open)
          if (!open) {
            resetForm()
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Testimonial</DialogTitle>
            <DialogDescription>Update testimonial information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-customerName">Customer Name *</Label>
                <Input
                  id="edit-customerName"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-customerEmail">Customer Email *</Label>
                <Input
                  id="edit-customerEmail"
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter testimonial title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-testimonial">Testimonial (Description) *</Label>
              <Textarea
                id="edit-testimonial"
                rows={4}
                value={formData.testimonial}
                onChange={(e) => setFormData({ ...formData, testimonial: e.target.value })}
                placeholder="Enter testimonial description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-tripPackage">Trip Package</Label>
                <Input
                  id="edit-tripPackage"
                  value={formData.tripPackage}
                  onChange={(e) => setFormData({ ...formData, tripPackage: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4">
              <div className="md:col-span-3 space-y-2">
                <Label htmlFor="edit-rating">Rating *</Label>
                <Select
                  value={formData.rating.toString()}
                  onValueChange={(value) => setFormData({ ...formData, rating: parseInt(value) })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 Stars</SelectItem>
                    <SelectItem value="4">4 Stars</SelectItem>
                    <SelectItem value="3">3 Stars</SelectItem>
                    <SelectItem value="2">2 Stars</SelectItem>
                    <SelectItem value="1">1 Star</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-3 space-y-2">
                <Label htmlFor="edit-status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "pending" | "approved" | "rejected") => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-customerImage">Customer Image</Label>
              <Input id="edit-customerImage" type="file" accept="image/*" onChange={handleImageChange} />
              {imagePreview && (
                <img src={imagePreview} alt="Preview" className="mt-2 w-24 h-24 rounded-full object-cover" />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTestimonial} disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Testimonial"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Testimonial Details</DialogTitle>
          </DialogHeader>
          {selectedTestimonial && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {selectedTestimonial.customerImage ? (
                  <img
                    src={selectedTestimonial.customerImage}
                    alt={selectedTestimonial.customerName}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold">{selectedTestimonial.customerName}</h3>
                  <p className="text-sm text-muted-foreground">{selectedTestimonial.customerEmail}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {renderStars(selectedTestimonial.rating)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <Badge 
                  variant={
                    selectedTestimonial.status === "approved" ? "default" : 
                    selectedTestimonial.status === "rejected" ? "destructive" : 
                    "secondary"
                  }
                >
                  {selectedTestimonial.status}
                </Badge>
                {selectedTestimonial.tripPackage && (
                  <div className="flex items-center gap-1 text-sm">
                    <Package className="h-4 w-4" />
                    {selectedTestimonial.tripPackage}
                  </div>
                )}
                {selectedTestimonial.location && (
                  <div className="flex items-center gap-1 text-sm">
                    <MapPin className="h-4 w-4" />
                    {selectedTestimonial.location}
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-semibold mb-2">Testimonial</h4>
                <p className="whitespace-pre-wrap text-sm">{selectedTestimonial.testimonial}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Testimonial</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this testimonial? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteDialogOpen(false)
              setTestimonialToDelete(null)
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTestimonial}
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
