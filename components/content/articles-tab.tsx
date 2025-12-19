"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Edit, Trash2, Eye, Calendar, User } from "lucide-react"
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

interface Article {
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

export function ArticlesTab() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    author: "",
    authorImage: "",
    publishedDate: new Date().toISOString().slice(0, 16),
    sectionType: "article" as const,
    image: "",
  })
  const [authorImageFile, setAuthorImageFile] = useState<File | null>(null)
  const [authorImagePreview, setAuthorImagePreview] = useState("")

  useEffect(() => {
    fetchArticles()
  }, [currentPage, searchQuery])

  const fetchArticles = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: currentPage.toString(),
        limit: "10",
      }
      
      if (searchQuery) {
        params.search = searchQuery
      }

      const queryString = new URLSearchParams(params).toString()
      const response = await fetch(`${API_BASE_URL}/api/admin/getAllArticles?${queryString}`)
      const result = await response.json()

      if (result.status) {
        setArticles(result.data || [])
        setTotalPages(result.pagination?.totalPages || 1)
      }
    } catch (error) {
      console.error("Fetch error:", error)
      toast({
        title: "Error",
        description: "Failed to fetch articles",
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

  const handleAddArticle = async () => {
    if (isSubmitting) return
    
    if (!formData.title) {
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
      formDataToSend.append("description", formData.description || "")
      formDataToSend.append("author", formData.author || "")
      formDataToSend.append("sectionType", "article")
      formDataToSend.append("status", "Published")
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

      const response = await fetch("${API_BASE_URL}/api/admin/addArticle", {
        method: "POST",
        body: formDataToSend,
      })

      const result = await response.json()

      if (result.status) {
        toast({
          title: "Success",
          description: "Article created successfully",
        })
        setIsAddDialogOpen(false)
        resetForm()
        fetchArticles()
      } else {
        throw new Error(result.message || "Failed to create article")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create article",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateArticle = async () => {
    if (!selectedArticle || isSubmitting) return

    try {
      setIsSubmitting(true)
      const formDataToSend = new FormData()
      formDataToSend.append("title", formData.title)
      formDataToSend.append("description", formData.description || "")
      formDataToSend.append("author", formData.author || "")
      formDataToSend.append("sectionType", "article")
      formDataToSend.append("status", "Published")
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

      const response = await fetch(`${API_BASE_URL}/api/admin/updateArticle/${selectedArticle._id}`, {
        method: "PUT",
        body: formDataToSend,
      })

      const result = await response.json()

      if (result.status) {
        toast({
          title: "Success",
          description: "Article updated successfully",
        })
        setIsEditDialogOpen(false)
        resetForm()
        fetchArticles()
      } else {
        throw new Error(result.message || "Failed to update article")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update article",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteArticle = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this article?")) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/deleteArticle/${id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.status) {
        toast({
          title: "Success",
          description: "Article deleted successfully",
        })
        fetchArticles()
      } else {
        throw new Error(result.message || "Failed to delete article")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete article",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (article: Article) => {
    setSelectedArticle(article)
    const date = new Date(article.publishedDate)
    const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)
    
    setFormData({
      title: article.title,
      description: article.description || "",
      author: article.author || "",
      authorImage: article.authorImage || "",
      sectionType: "article",
      publishedDate: localDateTime,
      image: article.image || "",
    })
    setImagePreview(article.image || "")
    setAuthorImagePreview(article.authorImage || "")
    setIsEditDialogOpen(true)
  }

  const openViewDialog = (article: Article) => {
    setSelectedArticle(article)
    setIsViewDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      author: "",
      authorImage: "",
      sectionType: "article",
      publishedDate: new Date().toISOString().slice(0, 16),
      image: "",
    })
    setImageFile(null)
    setImagePreview("")
    setAuthorImageFile(null)
    setAuthorImagePreview("")
    setSelectedArticle(null)
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
          <h2 className="text-2xl font-bold">Articles</h2>
          <p className="text-sm text-muted-foreground">
            Manage article posts for middle section
          </p>
        </div>
        <Button onClick={() => {
          resetForm()
          setIsAddDialogOpen(true)
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Article
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-8">Loading articles...</div>
      ) : articles.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No articles found. Create your first article!
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
                  {articles.map((article) => (
                    <tr key={article._id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        {article.image ? (
                          <img 
                            src={article.image} 
                            alt={article.title} 
                            className="w-16 h-16 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">
                            No Image
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="font-medium max-w-xs truncate">{article.title}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{article.author}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={article.status === "Published" ? "default" : "secondary"}>
                          {article.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDate(article.publishedDate)}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openViewDialog(article)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(article)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteArticle(article._id)}>
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
            <DialogTitle>Add New Article</DialogTitle>
            <DialogDescription>Create a new article for your website</DialogDescription>
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
                placeholder="Short description for article card"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4">
              <div className="md:col-span-3 space-y-2">
                <Label htmlFor="author">Author (Customer Name) *</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                />
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
            <div className="space-y-2">
              <Label htmlFor="authorImage">Customer Image (File or URL)</Label>
              <Input id="authorImage" type="file" accept="image/*" onChange={handleAuthorImageChange} className="mb-2" />
              <Input
                id="authorImageUrl"
                type="text"
                placeholder="Or enter image URL"
                value={formData.authorImage}
                onChange={(e) => {
                  setFormData({ ...formData, authorImage: e.target.value })
                  if (e.target.value) {
                    setAuthorImagePreview(e.target.value)
                  } else if (!authorImageFile) {
                    setAuthorImagePreview("")
                  }
                }}
              />
              {(authorImagePreview || formData.authorImage) && (
                <img src={authorImagePreview || formData.authorImage} alt="Preview" className="mt-2 w-24 h-24 rounded-full object-cover" />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleAddArticle} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Article"}
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
            <DialogTitle>Edit Article</DialogTitle>
            <DialogDescription>Update your article information</DialogDescription>
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
                placeholder="Short description for article card"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4">
              <div className="md:col-span-3 space-y-2">
                <Label htmlFor="edit-author">Author (Customer Name) *</Label>
                <Input
                  id="edit-author"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                />
              </div>
              <div className="md:col-span-3 space-y-2">
                <Label htmlFor="edit-publishedDate">Publish Date</Label>
                <Input
                  id="edit-publishedDate"
                  type="date"
                  value={formData.publishedDate}
                  onChange={(e) => setFormData({ ...formData, publishedDate: e.target.value })}
                />
              </div>
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
            <div className="space-y-2">
              <Label htmlFor="edit-authorImage">Customer Image (File or URL)</Label>
              <Input id="edit-authorImage" type="file" accept="image/*" onChange={handleAuthorImageChange} className="mb-2" />
              <Input
                id="edit-authorImageUrl"
                type="text"
                placeholder="Or enter image URL"
                value={formData.authorImage}
                onChange={(e) => {
                  setFormData({ ...formData, authorImage: e.target.value })
                  if (e.target.value) {
                    setAuthorImagePreview(e.target.value)
                  } else if (!authorImageFile) {
                    setAuthorImagePreview("")
                  }
                }}
              />
              {(authorImagePreview || formData.authorImage) && (
                <img src={authorImagePreview || formData.authorImage} alt="Preview" className="mt-2 w-24 h-24 rounded-full object-cover" />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateArticle} disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Article"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedArticle?.title}</DialogTitle>
          </DialogHeader>
          {selectedArticle && (
            <div className="space-y-4">
              {selectedArticle.image && (
                <img
                  src={selectedArticle.image}
                  alt={selectedArticle.title}
                  className="w-full h-64 object-cover rounded"
                />
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                <Badge variant={selectedArticle.status === "Published" ? "default" : "secondary"}>
                  {selectedArticle.status}
                </Badge>
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {selectedArticle.author}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(selectedArticle.publishedDate)}
                </div>
              </div>
              {selectedArticle.description && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Description</h3>
                  <p className="text-sm">{selectedArticle.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

