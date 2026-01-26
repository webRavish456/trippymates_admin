"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Edit, Trash2, Eye, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { API_BASE_URL } from "@/lib/config"
import { ListSkeleton } from "@/components/ui/skeletons"
import { RootState } from "../redux/store"
import { useSelector } from "react-redux"

interface FAQ {
  _id: string
  question: string
  answer: string
  category: "General" | "Booking" | "Payment" | "Cancellation" | "Travel" | "Other"
  status: "active" | "inactive"
  createdAt: string
}

type FAQsPermission = {
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

export function FAQsTab() {
  const permissions = useSelector(
    (state: RootState) => state.permission.permissions
  )
  const [hasPermission, setHasPermission] = useState<FAQsPermission>({
    create: false,
    update: false,
    delete: false,
  })
 
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedFAQ, setSelectedFAQ] = useState<FAQ | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "General" as "General" | "Booking" | "Payment" | "Cancellation" | "Travel" | "Other",
    status: "active" as "active" | "inactive",
  })

  useEffect(() => {
    fetchFAQs()
  }, [currentPage, searchQuery, categoryFilter, statusFilter])

  useEffect(() => {
    const faqsPermission = permissions.find(
      (p: Permission) => p.module === "content"
    )
    setHasPermission({
      create: faqsPermission?.create ?? false,
      update: faqsPermission?.update ?? false,
      delete: faqsPermission?.delete ?? false,
    })
  }, [])

  const fetchFAQs = async () => {
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
      if (categoryFilter !== "all") {
        params.category = categoryFilter
      }
      if (statusFilter !== "all") {
        params.status = statusFilter
      }

      const queryString = new URLSearchParams(params).toString()
      const response = await fetch(`${API_BASE_URL}/api/admin/getAllFAQs?${queryString}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const result = await response.json()

      if (result.status) {
        setFaqs(result.data || [])
        setTotalPages(result.pagination?.totalPages || 1)
      }
    } catch (error) {
      console.error("Fetch error:", error)
      toast({
        title: "Error",
        description: "Failed to fetch FAQs",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddFAQ = async () => {
    if (isSubmitting) return
    
    if (!formData.question || !formData.answer) {
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
      const response = await fetch("${API_BASE_URL}/api/admin/addFAQ", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.status) {
        toast({
          title: "Success",
          description: "FAQ created successfully",
        })
        setIsAddDialogOpen(false)
        resetForm()
        fetchFAQs()
      } else {
        throw new Error(result.message || "Failed to create FAQ")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create FAQ",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateFAQ = async () => {
    if (!selectedFAQ || isSubmitting) return

    try {
      setIsSubmitting(true)
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${API_BASE_URL}/api/admin/updateFAQ/${selectedFAQ._id}`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.status) {
        toast({
          title: "Success",
          description: "FAQ updated successfully",
        })
        setIsEditDialogOpen(false)
        resetForm()
        fetchFAQs()
      } else {
        throw new Error(result.message || "Failed to update FAQ")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update FAQ",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteFAQ = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this FAQ?")) return

    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${API_BASE_URL}/api/admin/deleteFAQ/${id}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()

      if (result.status) {
        toast({
          title: "Success",
          description: "FAQ deleted successfully",
        })
        fetchFAQs()
      } else {
        throw new Error(result.message || "Failed to delete FAQ")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete FAQ",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (faq: FAQ) => {
    setSelectedFAQ(faq)
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      status: faq.status,
    })
    setIsEditDialogOpen(true)
  }

  const openViewDialog = (faq: FAQ) => {
    setSelectedFAQ(faq)
    setIsViewDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      question: "",
      answer: "",
      category: "General",
      status: "active",
    })
    setSelectedFAQ(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">FAQs</h2>
          <p className="text-sm text-muted-foreground">Manage frequently asked questions</p>
        </div>
        {hasPermission.create && <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add FAQ
        </Button>}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="General">General</SelectItem>
                <SelectItem value="Booking">Booking</SelectItem>
                <SelectItem value="Payment">Payment</SelectItem>
                <SelectItem value="Cancellation">Cancellation</SelectItem>
                <SelectItem value="Travel">Travel</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <ListSkeleton items={8} />
      ) : faqs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No FAQs found. Create your first FAQ!
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium">Question</th>
                    <th className="text-left p-4 font-medium">Category</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {faqs.map((faq) => (
                    <tr key={faq._id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <div className="font-medium max-w-md truncate">{faq.question}</div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">{faq.category}</Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant={faq.status === "active" ? "default" : "secondary"}>
                          {faq.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openViewDialog(faq)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {hasPermission.update && <Button variant="ghost" size="sm" onClick={() => openEditDialog(faq)}>
                            <Edit className="h-4 w-4" />
                          </Button>}
                          {hasPermission.delete && <Button variant="ghost" size="sm" onClick={() => handleDeleteFAQ(faq._id)}>
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
            <DialogTitle>Add New FAQ</DialogTitle>
            <DialogDescription>Create a new frequently asked question</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4">
              <div className="md:col-span-6 space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: "General" | "Booking" | "Payment" | "Cancellation" | "Travel" | "Other") => 
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Booking">Booking</SelectItem>
                    <SelectItem value="Payment">Payment</SelectItem>
                    <SelectItem value="Cancellation">Cancellation</SelectItem>
                    <SelectItem value="Travel">Travel</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="question">Question *</Label>
              <Input
                id="question"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder="Enter the question"
              />
            </div>
            <div>
              <Label htmlFor="answer">Answer *</Label>
              <Textarea
                id="answer"
                rows={6}
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                placeholder="Enter the answer"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleAddFAQ} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create FAQ"}
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
            <DialogTitle>Edit FAQ</DialogTitle>
            <DialogDescription>Update FAQ information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4">
              <div className="md:col-span-6 space-y-2">
                <Label htmlFor="edit-category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: "General" | "Booking" | "Payment" | "Cancellation" | "Travel" | "Other") => 
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Booking">Booking</SelectItem>
                    <SelectItem value="Payment">Payment</SelectItem>
                    <SelectItem value="Cancellation">Cancellation</SelectItem>
                    <SelectItem value="Travel">Travel</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-question">Question *</Label>
              <Input
                id="edit-question"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-answer">Answer *</Label>
              <Textarea
                id="edit-answer"
                rows={6}
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4">
              <div className="md:col-span-6 space-y-2">
                <Label htmlFor="edit-status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "active" | "inactive") => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateFAQ} disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update FAQ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              FAQ Details
            </DialogTitle>
          </DialogHeader>
          {selectedFAQ && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 flex-wrap">
                <Badge variant="outline">{selectedFAQ.category}</Badge>
                <Badge variant={selectedFAQ.status === "active" ? "default" : "secondary"}>
                  {selectedFAQ.status}
                </Badge>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Question</h3>
                <p className="text-base">{selectedFAQ.question}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Answer</h3>
                <p className="whitespace-pre-wrap text-sm">{selectedFAQ.answer}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
