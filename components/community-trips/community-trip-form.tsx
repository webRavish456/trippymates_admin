"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { API_BASE_URL } from "@/lib/config"

const API_BASE = `${API_BASE_URL}/api/admin/community-trip`

interface CommunityTripFormProps {
  tripId: string
}

export default function CommunityTripForm({ tripId }: CommunityTripFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    location: "",
    groupType: "Mixed Group",
    tripType: "adventure",
    maxMembers: 20,
    importantNotes: ""
  })

  const [images, setImages] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])

  useEffect(() => {
    if (tripId && tripId !== 'new') {
      fetchTrip()
    }
  }, [tripId])

  const fetchTrip = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${API_BASE}/${tripId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const result = await response.json()

      if (result.status && result.data) {
        const trip = result.data
        setFormData({
          title: trip.title || "",
          description: trip.description || "",
          startDate: trip.startDate ? new Date(trip.startDate).toISOString().split('T')[0] : "",
          endDate: trip.endDate ? new Date(trip.endDate).toISOString().split('T')[0] : "",
          location: trip.location || "",
          groupType: trip.groupType || "Mixed Group",
          tripType: trip.tripType || "adventure",
          maxMembers: trip.maxMembers || 20,
          importantNotes: trip.importantNotes || ""
        })
        if (trip.images && trip.images.length > 0) {
          setExistingImages(trip.images.map((img: any) => img.path))
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch trip",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const token = localStorage.getItem('adminToken')
      const submitFormData = new FormData()

      // Add all form fields
      Object.keys(formData).forEach((key) => {
        const value = formData[key as keyof typeof formData]
        submitFormData.append(key, String(value || ''))
      })

      // Add images
      images.forEach((image) => {
        submitFormData.append('images', image)
      })

      const url = tripId === 'new'
        ? `${API_BASE}/create`
        : `${API_BASE}/update/${tripId}`
      const method = tripId === 'new' ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: submitFormData
      })

      const data = await response.json()

      if (data.status) {
        toast({
          title: "Success",
          description: tripId === 'new' ? "Community trip created successfully" : "Community trip updated successfully",
        })
        router.push('/admin/community-trips')
      } else {
        throw new Error(data.message || "Failed to save trip")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save trip",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      setImages(Array.from(files))
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const removeExistingImage = (index: number) => {
    setExistingImages(existingImages.filter((_, i) => i !== index))
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="space-y-6 p-6">
      <div>
          <h1 className="text-3xl font-bold">
            {tripId === 'new' ? 'Create Community Trip' : 'Edit Community Trip'}
          </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Trip Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="space-y-2 md:col-span-6">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-6">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-6">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-6">
                <Label htmlFor="groupType">Group Type *</Label>
                <Select
                  value={formData.groupType}
                  onValueChange={(value) => setFormData({ ...formData, groupType: value })}
                >
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
              <div className="space-y-2 md:col-span-6">
                <Label htmlFor="tripType">Trip Type *</Label>
                <Select
                  value={formData.tripType}
                  onValueChange={(value) => setFormData({ ...formData, tripType: value })}
                >
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
              <div className="space-y-2 md:col-span-6">
                <Label htmlFor="maxMembers">Max Members *</Label>
                <Input
                  id="maxMembers"
                  type="number"
                  min="1"
                  value={formData.maxMembers}
                  onChange={(e) => setFormData({ ...formData, maxMembers: parseInt(e.target.value) || 20 })}
                  required
                  className="w-full"
                />
              </div>
              <div className="space-y-2 md:col-span-6">
                <Label htmlFor="location">Destination *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                required
              />
            </div>

            {/* Images */}
            <div className="space-y-2">
              <Label>Trip Images</Label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {existingImages.map((img, idx) => (
                  <div key={idx} className="relative">
                    <img src={img} alt={`Trip ${idx + 1}`} className="h-20 w-20 object-cover rounded" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={() => removeExistingImage(idx)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {images.map((img, idx) => (
                  <div key={idx} className="relative">
                    <img src={URL.createObjectURL(img)} alt={`New ${idx + 1}`} className="h-20 w-20 object-cover rounded" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={() => removeImage(idx)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="importantNotes">Important Notes</Label>
              <Textarea
                id="importantNotes"
                value={formData.importantNotes}
                onChange={(e) => setFormData({ ...formData, importantNotes: e.target.value })}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : tripId === 'new' ? 'Create Trip' : 'Update Trip'}
          </Button>
        </div>
      </form>
    </div>
  )
}

