"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Edit, Trash2, Eye, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { API_BASE_URL } from "@/lib/config"
import { ListSkeleton } from "@/components/ui/skeletons"
import { RootState } from "../redux/store"
import { useSelector } from "react-redux"

interface AdventurePost {
  _id: string
  title: string
  description?: string
  image: string
  location?: string
  status: "active" | "inactive"
  order?: number
  createdAt?: string
  updatedAt?: string
}

type AdventurePostsPermission = {
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

export function AdventurePostsTab() {
  const permissions = useSelector(
    (state: RootState) => state.permission.permissions
  )
  const [hasPermission, setHasPermission] = useState<AdventurePostsPermission>({
    create: false,
    update: false,
    delete: false,
  })

  const [adventurePosts, setAdventurePosts] = useState<AdventurePost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [postToDelete, setPostToDelete] = useState<string | null>(null)
  const [selectedPost, setSelectedPost] = useState<AdventurePost | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: "",
    location: "",
    status: "active" as "active" | "inactive",
    order: 0,
  })

  useEffect(() => {
    fetchAdventurePosts()
  }, [currentPage, searchQuery])

  useEffect(() => {
    const adventurePostsPermission = permissions.find(
      (p: Permission) => p.module === "content"
    )
    setHasPermission({
      create: adventurePostsPermission?.create ?? false,
      update: adventurePostsPermission?.update ?? false,
      delete: adventurePostsPermission?.delete ?? false,
    })
  }, [])

  const fetchAdventurePosts = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: currentPage.toString(),
        limit: "10",
        status: "active", // Only fetch active posts
      }

      if (searchQuery) {
        params.search = searchQuery
      }

      const queryString = new URLSearchParams(params).toString()
      const token = localStorage.getItem('token') || document.cookie.split('token=')[1]?.split(';')[0]
      const response = await fetch(`${API_BASE_URL}/api/admin/adventure-post/all?${queryString}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })
      const result = await response.json()

      if (result.status) {
        // Backend already filters by status, so use all returned posts
        setAdventurePosts(result.data?.adventurePosts || [])
        setTotalPages(result.data?.pagination?.pages || 1)
      }
    } catch (error) {
      console.error("Fetch error:", error)
      toast({
        title: "Error",
        description: "Failed to fetch adventure posts",
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

  const handleAdd = () => {
    setFormData({
      title: "",
      description: "",
      image: "",
      location: "",
      status: "active", // Default for new posts
      order: 0,
    })
    setImageFile(null)
    setImagePreview("")
    setIsAddDialogOpen(true)
  }

  const handleEdit = (post: AdventurePost) => {
    setSelectedPost(post)
    setFormData({
      title: post.title || "",
      description: post.description || "",
      image: post.image || "",
      location: post.location || "",
      status: post.status || "active", // Default to active
      order: post.order || 0,
    })
    setImagePreview(post.image || "")
    setImageFile(null)
    setIsEditDialogOpen(true)
  }

  const handleView = (post: AdventurePost) => {
    setSelectedPost(post)
    setIsViewDialogOpen(true)
  }

  const handleDeleteClick = (id: string) => {
    setPostToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!postToDelete) return

    try {
      const token = localStorage.getItem('token') || document.cookie.split('token=')[1]?.split(';')[0]
      const response = await fetch(`${API_BASE_URL}/api/admin/adventure-post/delete/${postToDelete}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })
      const result = await response.json()

      if (result.status) {
        toast({
          title: "Success",
          description: "Adventure post deleted successfully",
        })
        setIsDeleteDialogOpen(false)
        setPostToDelete(null)
        fetchAdventurePosts()
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to delete adventure post",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Delete error:", error)
      toast({
        title: "Error",
        description: "Failed to delete adventure post",
        variant: "destructive",
      })
    } finally {
      setIsDeleteDialogOpen(false)
      setPostToDelete(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || (!imageFile && !formData.image)) {
      toast({
        title: "Error",
        description: "Title and image are required",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const token = localStorage.getItem('token') || document.cookie.split('token=')[1]?.split(';')[0]
      const formDataToSend = new FormData()
      formDataToSend.append("title", formData.title)
      formDataToSend.append("location", formData.location || "")
      
      // For create, status is always "active", for edit include status only
      if (selectedPost) {
        formDataToSend.append("status", formData.status)
      } else {
        formDataToSend.append("status", "active") // Always active for new posts
      }

      if (imageFile) {
        formDataToSend.append("image", imageFile)
      } else if (formData.image) {
        formDataToSend.append("image", formData.image)
      }

      const url = selectedPost
        ? `${API_BASE_URL}/api/admin/adventure-post/update/${selectedPost._id}`
        : `${API_BASE_URL}/api/admin/adventure-post/add`

      const method = selectedPost ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      })

      const result = await response.json()

      if (result.status) {
        toast({
          title: "Success",
          description: selectedPost
            ? "Adventure post updated successfully"
            : "Adventure post created successfully",
        })
        setIsAddDialogOpen(false)
        setIsEditDialogOpen(false)
        setSelectedPost(null)
        setImageFile(null)
        setImagePreview("")
        // Reset to first page and refresh
        setCurrentPage(1)
        fetchAdventurePosts()
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to save adventure post",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Submit error:", error)
      toast({
        title: "Error",
        description: "Failed to save adventure post",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search adventure posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {hasPermission.create && (
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Adventure Post
          </Button>
        )}
      </div>

      {loading ? (
        <ListSkeleton items={8} />
      ) : adventurePosts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No adventure posts found</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium">Image</th>
                    <th className="text-left p-4 font-medium">Title</th>
                    <th className="text-left p-4 font-medium">Location</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adventurePosts.map((post) => (
                    <tr key={post._id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <img
                          src={post.image}
                          alt={post.title}
                          className="w-16 h-16 object-cover rounded"
                        />
                      </td>
                      <td className="p-4">
                        <div className="font-medium max-w-md truncate">{post.title}</div>
                        {post.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                            {post.description}
                          </p>
                        )}
                      </td>
                      <td className="p-4">
                        {post.location ? (
                          <span className="text-sm">{post.location}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <Badge variant={post.status === "active" ? "default" : "secondary"}>
                          {post.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleView(post)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {hasPermission.update && (
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(post)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {hasPermission.delete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(post._id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex justify-end gap-2 pt-4 border-t px-4 pb-4">
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
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Adventure Post</DialogTitle>
            <DialogDescription>
              Create a new adventure post to showcase travel moments
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="w-full">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full"
                />
              </div>
              <div className="w-full">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full"
                />
              </div>
              <div className="w-full">
                <Label htmlFor="image">Image *</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  required
                  className="w-full"
                />
                {imagePreview && (
                  <div className="mt-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded"
                    />
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Adventure Post</DialogTitle>
            <DialogDescription>
              Update the adventure post details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="w-full">
                <Label htmlFor="edit-title">Title *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full"
                />
              </div>
              <div className="w-full">
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full"
                />
              </div>
              <div className="w-full">
                <Label htmlFor="edit-image">Image *</Label>
                <Input
                  id="edit-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full"
                />
                {imagePreview && (
                  <div className="mt-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded"
                    />
                  </div>
                )}
              </div>
              <div className="w-full">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "active" | "inactive") =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPost?.title}</DialogTitle>
          </DialogHeader>
          {selectedPost && (
            <div className="space-y-4">
              <div className="w-full flex justify-center">
                <img
                  src={selectedPost.image}
                  alt={selectedPost.title}
                  className="w-full h-auto object-contain rounded"
                  style={{ maxHeight: '400px', maxWidth: '100%' }}
                />
              </div>
              {selectedPost.location && (
                <div>
                  <Label>Location</Label>
                  <p className="text-sm text-muted-foreground">{selectedPost.location}</p>
                </div>
              )}
              <div>
                <Label>Status</Label>
                <Badge variant={selectedPost.status === "active" ? "default" : "secondary"}>
                  {selectedPost.status}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Adventure Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this adventure post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteDialogOpen(false)
              setPostToDelete(null)
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
