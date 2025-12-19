"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Edit, Trash2, Eye, Calendar, User, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import TipTapEditor from "@/components/ui/tiptap-editor"
import { API_BASE_URL } from "@/lib/config"

interface Blog {
  _id: string
  title: string
  content: string
  description?: string
  category?: string
  author: string
  authorImage?: string
  readTime?: string
  publishedDate: string
  tags: string[]
  image?: string
  status: "Draft" | "Published"
  sectionType?: "main" | "article"
  featured?: boolean
}

interface BlogPostsTabProps {
  sectionType?: "main" | "article"
}

export function BlogPostsTab({ sectionType = "main" }: BlogPostsTabProps) {
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    description: "",
    category: "",
    author: "",
    authorImage: "",
    readTime: "",
    tags: "",
    status: "Draft" as "Draft" | "Published",
    publishedDate: new Date().toISOString().slice(0, 16),
    sectionType: sectionType,
    featured: false,
    image: "",
  })
  const [authorImageFile, setAuthorImageFile] = useState<File | null>(null)
  const [authorImagePreview, setAuthorImagePreview] = useState("")

  useEffect(() => {
    fetchBlogs()
  }, [currentPage, searchQuery])

  const fetchBlogs = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: currentPage.toString(),
        limit: "10",
        sectionType: sectionType || "main",
      }
      
      if (searchQuery) {
        params.search = searchQuery
      }

      const queryString = new URLSearchParams(params).toString()
      const response = await fetch(`${API_BASE_URL}/api/admin/getAllBlogs?${queryString}`)
      const result = await response.json()

      if (result.status) {
        setBlogs(result.data || [])
        setTotalPages(result.pagination?.totalPages || 1)
      }
    } catch (error) {
      console.error("Fetch error:", error)
      toast({
        title: "Error",
        description: "Failed to fetch blogs",
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

  const handleAuthorImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAuthorImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAuthorImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddBlog = async () => {
    if (isSubmitting) return
    
    if (!formData.title || !formData.content) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      const formDataToSend = new FormData()
      formDataToSend.append("title", formData.title)
      formDataToSend.append("content", formData.content)
      formDataToSend.append("description", formData.description || "")
      formDataToSend.append("category", formData.category || "Travel")
      formDataToSend.append("author", formData.author || "")
      formDataToSend.append("readTime", formData.readTime || "5 min read")
      formDataToSend.append("tags", formData.tags)
      formDataToSend.append("status", formData.status)
      formDataToSend.append("sectionType", formData.sectionType || sectionType)
      formDataToSend.append("featured", formData.featured.toString())
      formDataToSend.append("publishedDate", new Date(formData.publishedDate).toISOString())
      
      if (imageFile) {
        formDataToSend.append("image", imageFile)
      } else if (formData.image) {
        formDataToSend.append("image", formData.image)
      }
      if (authorImageFile) {
        formDataToSend.append("authorImage", authorImageFile)
      } else if (formData.authorImage) {
        formDataToSend.append("authorImage", formData.authorImage)
      }

      const response = await fetch("${API_BASE_URL}/api/admin/addBlog", {
        method: "POST",
        body: formDataToSend,
      })

      const result = await response.json()

      if (result.status) {
        toast({
          title: "Success",
          description: "Blog created successfully",
        })
        setIsAddDialogOpen(false)
        resetForm()
        fetchBlogs()
      } else {
        throw new Error(result.message || "Failed to create blog")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create blog",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateBlog = async () => {
    if (!selectedBlog || isSubmitting) return

    try {
      setIsSubmitting(true)
      const formDataToSend = new FormData()
      formDataToSend.append("title", formData.title)
      formDataToSend.append("content", formData.content)
      formDataToSend.append("description", formData.description || "")
      formDataToSend.append("category", formData.category || "Travel")
      formDataToSend.append("author", formData.author || "")
      formDataToSend.append("readTime", formData.readTime || "5 min read")
      formDataToSend.append("tags", formData.tags)
      formDataToSend.append("status", formData.status)
      formDataToSend.append("sectionType", formData.sectionType || sectionType)
      formDataToSend.append("featured", formData.featured.toString())
      formDataToSend.append("publishedDate", new Date(formData.publishedDate).toISOString())
      
      if (imageFile) {
        formDataToSend.append("image", imageFile)
      } else if (formData.image) {
        formDataToSend.append("image", formData.image)
      }
      if (authorImageFile) {
        formDataToSend.append("authorImage", authorImageFile)
      } else if (formData.authorImage) {
        formDataToSend.append("authorImage", formData.authorImage)
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/updateBlog/${selectedBlog._id}`, {
        method: "PUT",
        body: formDataToSend,
      })

      const result = await response.json()

      if (result.status) {
        toast({
          title: "Success",
          description: "Blog updated successfully",
        })
        setIsEditDialogOpen(false)
        resetForm()
        fetchBlogs()
      } else {
        throw new Error(result.message || "Failed to update blog")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update blog",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteBlog = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this blog?")) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/deleteBlog/${id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.status) {
        toast({
          title: "Success",
          description: "Blog deleted successfully",
        })
        fetchBlogs()
      } else {
        throw new Error(result.message || "Failed to delete blog")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete blog",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (blog: Blog) => {
    setSelectedBlog(blog)
    const date = new Date(blog.publishedDate)
    const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)
    
    setFormData({
      title: blog.title,
      content: blog.content,
      description: blog.description || "",
      category: blog.category || "Travel",
      author: blog.author || "",
      authorImage: blog.authorImage || "",
      readTime: blog.readTime || "5 min read",
      tags: Array.isArray(blog.tags) ? blog.tags.join(", ") : "",
      status: blog.status,
      sectionType: blog.sectionType || sectionType,
      featured: blog.featured || false,
      publishedDate: localDateTime,
      image: blog.image || "",
    })
    setImagePreview(blog.image || "")
    setAuthorImagePreview(blog.authorImage || "")
    setIsEditDialogOpen(true)
  }

  const openViewDialog = (blog: Blog) => {
    setSelectedBlog(blog)
    setIsViewDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      description: "",
      category: "",
      author: "",
      authorImage: "",
      readTime: "",
      tags: "",
      status: "Draft",
      sectionType: sectionType,
      featured: false,
      publishedDate: new Date().toISOString().slice(0, 16),
      image: "",
    })
    setImageFile(null)
    setImagePreview("")
    setAuthorImageFile(null)
    setAuthorImagePreview("")
    setSelectedBlog(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">
            {sectionType === "article" ? "Articles" : "Blog Posts"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {sectionType === "article" 
              ? "Manage article posts for middle section" 
              : "Manage main blog posts for top section"}
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add {sectionType === "article" ? "Article" : "Blog Post"}
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search blogs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-8">Loading blogs...</div>
      ) : blogs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No blogs found. Create your first blog post!
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
                    <th className="text-left p-4 font-medium">Author</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Published Date</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {blogs.map((blog) => (
                    <tr key={blog._id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        {blog.image ? (
                          <img 
                            src={blog.image} 
                            alt={blog.title} 
                            className="w-16 h-16 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">
                            No Image
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="font-medium max-w-xs truncate">{blog.title}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{blog.author}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={blog.status === "Published" ? "default" : "secondary"}>
                          {blog.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDate(blog.publishedDate)}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openViewDialog(blog)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(blog)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteBlog(blog._id)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
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

      <Dialog 
        open={isAddDialogOpen} 
        onOpenChange={(open) => {
          setIsAddDialogOpen(open)
          if (open) {
            resetForm()
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Blog Post</DialogTitle>
            <DialogDescription>Create a new blog post for your website</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Short description for blog card"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <TipTapEditor
                content={formData.content}
                onChange={(html) => setFormData({ ...formData, content: html })}
                placeholder="Start writing your blog content..."
                editable={true}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Travel">Travel</SelectItem>
                    <SelectItem value="Adventure">Adventure</SelectItem>
                    <SelectItem value="Culture">Culture</SelectItem>
                    <SelectItem value="Nature">Nature</SelectItem>
                    <SelectItem value="Beach">Beach</SelectItem>
                    <SelectItem value="Wildlife">Wildlife</SelectItem>
                    <SelectItem value="Food">Food</SelectItem>
                    <SelectItem value="Photography">Photography</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="readTime">Read Time</Label>
                <Input
                  id="readTime"
                  value={formData.readTime}
                  onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                  placeholder="e.g., 5 min read"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4">
              <div className="md:col-span-3 space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "Draft" | "Published") => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-3 space-y-2">
                <Label htmlFor="publishedDate">Publish Date</Label>
                <Input
                  id="publishedDate"
                  type="date"
                  value={formData.publishedDate}
                  onChange={(e) => setFormData({ ...formData, publishedDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="e.g., Experience, Nature, Travel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Featured Image (File or URL)</Label>
              <Input id="image" type="file" accept="image/*" onChange={handleImageChange} className="mb-2" />
              <Input
                id="imageUrl"
                type="text"
                placeholder="Or enter image URL"
                value={formData.image}
                onChange={(e) => {
                  setFormData({ ...formData, image: e.target.value })
                  if (e.target.value) {
                    setImagePreview(e.target.value)
                  } else if (!imageFile) {
                    setImagePreview("")
                  }
                }}
              />
              {(imagePreview || formData.image) && (
                <img src={imagePreview || formData.image} alt="Preview" className="mt-2 w-full h-48 object-cover rounded" />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleAddBlog} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Blog"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog 
        open={isEditDialogOpen} 
        onOpenChange={(open) => {
          setIsEditDialogOpen(open)
          if (!open) {
            resetForm()
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Blog Post</DialogTitle>
            <DialogDescription>Update your blog post information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Short description for blog card"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-content">Content *</Label>
              <TipTapEditor
                content={formData.content}
                onChange={(html) => setFormData({ ...formData, content: html })}
                placeholder="Start writing your blog content..."
                editable={true}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Travel">Travel</SelectItem>
                    <SelectItem value="Adventure">Adventure</SelectItem>
                    <SelectItem value="Culture">Culture</SelectItem>
                    <SelectItem value="Nature">Nature</SelectItem>
                    <SelectItem value="Beach">Beach</SelectItem>
                    <SelectItem value="Wildlife">Wildlife</SelectItem>
                    <SelectItem value="Food">Food</SelectItem>
                    <SelectItem value="Photography">Photography</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="edit-readTime">Read Time</Label>
                <Input
                  id="edit-readTime"
                  value={formData.readTime}
                  onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                  placeholder="e.g., 5 min read"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="edit-author">Author</Label>
                <Input
                  id="edit-author"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4">
              <div className="md:col-span-3 space-y-2">
                <Label htmlFor="edit-status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "Draft" | "Published") => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-3 space-y-2">
                <Label htmlFor="edit-publishedDate">Publish Date & Time *</Label>
                <Input
                  id="edit-publishedDate"
                  type="datetime-local"
                  value={formData.publishedDate}
                  onChange={(e) => setFormData({ ...formData, publishedDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-tags">Tags (comma separated)</Label>
              <Input
                id="edit-tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="e.g., tech, nodejs, blog"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-image">Featured Image (File or URL)</Label>
              <Input id="edit-image" type="file" accept="image/*" onChange={handleImageChange} className="mb-2" />
              <Input
                id="edit-imageUrl"
                type="text"
                placeholder="Or enter image URL"
                value={formData.image}
                onChange={(e) => {
                  setFormData({ ...formData, image: e.target.value })
                  if (e.target.value) {
                    setImagePreview(e.target.value)
                  } else if (!imageFile) {
                    setImagePreview("")
                  }
                }}
              />
              {(imagePreview || formData.image) && (
                <img src={imagePreview || formData.image} alt="Preview" className="mt-2 w-full h-48 object-cover rounded" />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateBlog} disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Blog"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedBlog?.title}</DialogTitle>
          </DialogHeader>
          {selectedBlog && (
            <div className="space-y-4">
              {selectedBlog.image && (
                <img
                  src={selectedBlog.image}
                  alt={selectedBlog.title}
                  className="w-full h-64 object-cover rounded"
                />
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                <Badge variant={selectedBlog.status === "Published" ? "default" : "secondary"}>
                  {selectedBlog.status}
                </Badge>
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {selectedBlog.author}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(selectedBlog.publishedDate)}
                </div>
              </div>
              {selectedBlog.tags && selectedBlog.tags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="h-4 w-4" />
                  {selectedBlog.tags.map((tag, idx) => (
                    <Badge key={idx} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Content</h3>
                <div 
                  className="prose prose-sm max-w-none [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-5 [&_h3]:mb-2 [&_p]:mb-4 [&_p]:leading-relaxed [&_ul]:pl-6 [&_ol]:pl-6 [&_li]:mb-2 [&_img]:w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-4 [&_a]:text-blue-600 [&_a]:underline [&_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:rounded-lg [&_iframe]:my-4"
                  dangerouslySetInnerHTML={{ __html: selectedBlog.content }}
                  style={{
                    lineHeight: '1.7',
                    fontSize: '0.875rem',
                  }}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}