"use client"

import { useState, useEffect } from "react"
import { Save } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { API_BASE_URL } from "@/lib/config"

const API_BASE = `${API_BASE_URL}/api/admin/banner`

export function BannerFormTab() {
  const router = useRouter()
  const params = useParams()
  const bannerId = params?.id as string
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: "",
    link: "",
    status: "active" as "active" | "inactive",
    validFrom: "",
    validUntil: ""
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")

  useEffect(() => {
    if (bannerId && bannerId !== 'new') {
      fetchBanner(bannerId)
    }
  }, [bannerId])

  const fetchBanner = async (id: string) => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${API_BASE}/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      
      if (data.status && data.data) {
        const banner = data.data
        setFormData({
          title: banner.title || "",
          description: banner.description || "",
          image: banner.image || "",
          link: banner.link || "",
          status: banner.status || "active",
          validFrom: banner.validFrom ? new Date(banner.validFrom).toISOString().split('T')[0] : "",
          validUntil: banner.validUntil ? new Date(banner.validUntil).toISOString().split('T')[0] : ""
        })
        if (banner.image) {
          setImagePreview(banner.image)
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch banner",
        variant: "destructive",
      })
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate that either file is selected or image URL is provided
    if (!selectedFile && !formData.image) {
      toast({
        title: "Error",
        description: "Please select an image file or provide an image URL",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const token = localStorage.getItem('adminToken')
      const url = bannerId && bannerId !== 'new' ? `${API_BASE}/update/${bannerId}` : `${API_BASE}/add`
      const method = bannerId && bannerId !== 'new' ? 'PUT' : 'POST'

      let response: Response

      // If file is selected, use FormData, otherwise use JSON
      if (selectedFile) {
        const formDataToSend = new FormData()
        formDataToSend.append('image', selectedFile)
        formDataToSend.append('title', formData.title)
        formDataToSend.append('description', formData.description || '')
        formDataToSend.append('link', formData.link || '')
        formDataToSend.append('width', '1080')
        formDataToSend.append('height', '600')
        formDataToSend.append('status', formData.status)
        if (formData.validFrom) formDataToSend.append('validFrom', formData.validFrom)
        if (formData.validUntil) formDataToSend.append('validUntil', formData.validUntil)

        response = await fetch(url, {
          method,
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formDataToSend
        })
      } else {
        const payload = {
          ...formData,
          validFrom: formData.validFrom || null,
          validUntil: formData.validUntil || null,
          width: 1080,
          height: 600
        }
        response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        })
      }

      const data = await response.json()

      if (data.status) {
        toast({
          title: "Success",
          description: bannerId && bannerId !== 'new' ? "Banner updated successfully" : "Banner created successfully",
        })
        setSelectedFile(null)
        router.push('/admin/banner')
      } else {
        throw new Error(data.message || "Failed to save banner")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save banner",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">{bannerId && bannerId !== 'new' ? 'Edit Banner' : 'Create New Banner'}</h2>
        <p className="text-sm text-muted-foreground">Manage website banners</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Banner Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Banner title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Banner description..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Image *</Label>
              <div className="space-y-3">
                <Input
                  id="imageFile"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                <div className="text-sm text-muted-foreground">OR</div>
                <Input
                  id="image"
                  value={formData.image}
                  onChange={(e) => {
                    setFormData({ ...formData, image: e.target.value })
                    setImagePreview(e.target.value)
                  }}
                  placeholder="https://example.com/banner.jpg"
                />
              </div>
              {imagePreview && (
                <div className="mt-2">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="max-w-full h-auto max-h-48 rounded border"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="link">Link URL (Optional)</Label>
              <Input
                id="link"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                placeholder="https://example.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="validFrom">Valid From (Optional)</Label>
                <Input
                  id="validFrom"
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validUntil">Valid Until (Optional)</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                />
              </div>
            </div>

            {bannerId && bannerId !== 'new' && (
              <div className="flex items-center gap-2">
                <Switch
                  id="status"
                  checked={formData.status === 'active'}
                  onCheckedChange={(checked) => setFormData({ ...formData, status: checked ? 'active' : 'inactive' })}
                />
                <Label htmlFor="status">Active</Label>
              </div>
            )}

            <div className="flex gap-4 justify-end">
              <Button type="button" variant="outline" onClick={() => router.push('/admin/banner')}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Saving...' : bannerId && bannerId !== 'new' ? 'Update Banner' : 'Create Banner'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}

