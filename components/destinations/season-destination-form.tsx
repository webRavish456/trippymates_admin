"use client"

import { useState, useEffect } from "react"
import { Save, Upload, X, Plus, MapPin, Cloud, Camera, MapPinned, Utensils, Hotel, Activity, Calendar, Trash2, ChevronDown, ChevronUp, Edit } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface PlaceDetail {
  placeName: string
  description: string
  weatherInfo: string
  images: string[]
  food: Array<{ name: string; description: string; image: string; type?: string; vegType?: string; nonVegType?: string }>
  hotels: Array<{ name: string; description: string; image: string; rating?: number; priceRange?: string; location?: string }>
  activities: Array<{ name: string; type: string; description: string; image: string; duration?: string; priceRange?: string; location?: string }>
  eventsFestivals: Array<{ name: string; type: string; description: string; image: string; month?: string; date?: string; location?: string }>
  nearbyDestinations: Array<{ name: string; distance: string; description: string; image: string }>
  topAttractions: Array<{ name: string; image: string; description: string }>
}

interface SeasonDestinationFormProps {
  initialData?: any
  isEdit?: boolean
}

import { API_BASE_URL } from "@/lib/config"

const API_BASE = `${API_BASE_URL}/api/admin/destination`

export function SeasonDestinationForm({ initialData, isEdit = false }: SeasonDestinationFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    color: "#af52de",
    places: "",
    location: "",
    desc: "",
    type: "season",
    status: "active" as "active" | "inactive",
    placesDetails: [] as PlaceDetail[],
  })

  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [selectedPlaceIndex, setSelectedPlaceIndex] = useState<number | null>(null)
  const [expandedPlaces, setExpandedPlaces] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (initialData && isEdit) {
      setFormData({
        title: initialData.title || "",
        color: initialData.color || "#af52de",
        places: initialData.places || "",
        location: initialData.location || "",
        desc: initialData.desc || "",
        type: "season",
        status: initialData.status || "active",
        placesDetails: initialData.placesDetails || [],
      })
      // Handle both single image and multiple images
      if (initialData.images && Array.isArray(initialData.images)) {
        setImagePreviews(initialData.images)
      } else if (initialData.image) {
        setImagePreviews([initialData.image])
      }
      if (initialData.placesDetails?.length > 0) {
        setExpandedPlaces(new Set([0])) // Expand first place by default
      }
    }
  }, [initialData, isEdit])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setImageFiles(prev => [...prev, ...files])
      const previews = files.map((file) => URL.createObjectURL(file))
      setImagePreviews(prev => [...prev, ...previews])
    }
  }

  const removeImage = (index: number) => {
    // Check if it's a new file or existing image
    const existingImagesCount = initialData?.images?.length || (initialData?.image ? 1 : 0)
    if (index < existingImagesCount) {
      // It's an existing image - remove from previews only
      setImagePreviews(imagePreviews.filter((_, i) => i !== index))
    } else {
      // It's a new file - remove from both files and previews
      const fileIndex = index - existingImagesCount
      setImageFiles(imageFiles.filter((_, i) => i !== fileIndex))
      setImagePreviews(imagePreviews.filter((_, i) => i !== index))
    }
  }

  const addPlace = () => {
    const newPlace: PlaceDetail = {
      placeName: "",
      description: "",
      weatherInfo: "",
      images: [],
      food: [],
      hotels: [],
      activities: [],
      eventsFestivals: [],
      nearbyDestinations: [],
      topAttractions: [],
    }
    setFormData({
      ...formData,
      placesDetails: [...formData.placesDetails, newPlace],
    })
    setSelectedPlaceIndex(formData.placesDetails.length)
    setExpandedPlaces(new Set([...expandedPlaces, formData.placesDetails.length]))
    toast({
      title: "Success",
      description: "New place added. Fill in the details below.",
    })
  }

  const removePlace = (index: number) => {
    setFormData({
      ...formData,
      placesDetails: formData.placesDetails.filter((_, i) => i !== index),
    })
    const newExpanded = new Set(expandedPlaces)
    newExpanded.delete(index)
    setExpandedPlaces(newExpanded)
  }

  const updatePlaceDetail = (index: number, field: keyof PlaceDetail, value: any) => {
    const updated = [...formData.placesDetails]
    updated[index] = { ...updated[index], [field]: value }
    setFormData((prev) => ({ ...prev, placesDetails: updated }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.desc) {
      toast({
        title: "Validation Error",
        description: "Please fill in Month and Description",
        variant: "destructive",
      })
      return
    }

    if (formData.placesDetails.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one place with details",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append("title", formData.title)
      formDataToSend.append("color", formData.color || "#af52de") // Default color if not set
      formDataToSend.append("desc", formData.desc)
      formDataToSend.append("type", "season")
      // Status is handled automatically by backend for new destinations
      if (isEdit) {
        formDataToSend.append("status", formData.status)
      } else {
        formDataToSend.append("status", "active") // Default active
      }
      formDataToSend.append("name", formData.title)
      formDataToSend.append("description", formData.desc)

      // Create places string from placesDetails
      const placesString = formData.placesDetails.map(p => p.placeName).join(", ")
      formDataToSend.append("places", placesString)
      formDataToSend.append("location", formData.location || placesString)

      // Extract imageFiles from placesDetails before stringifying
      const placesDetailsForJSON = formData.placesDetails.map((place, placeIndex) => {
        const cleanPlace: any = { ...place }
        
        // Remove imageFile from each array and collect them separately
        if (cleanPlace.topAttractions) {
          cleanPlace.topAttractions = cleanPlace.topAttractions.map((item: any) => {
            const { imageFile, ...rest } = item
            return rest
          })
        }
        if (cleanPlace.food) {
          cleanPlace.food = cleanPlace.food.map((item: any) => {
            const { imageFile, ...rest } = item
            return rest
          })
        }
        if (cleanPlace.hotels) {
          cleanPlace.hotels = cleanPlace.hotels.map((item: any) => {
            const { imageFile, ...rest } = item
            return rest
          })
        }
        if (cleanPlace.activities) {
          cleanPlace.activities = cleanPlace.activities.map((item: any) => {
            const { imageFile, ...rest } = item
            return rest
          })
        }
        if (cleanPlace.eventsFestivals) {
          cleanPlace.eventsFestivals = cleanPlace.eventsFestivals.map((item: any) => {
            const { imageFile, ...rest } = item
            return rest
          })
        }
        if (cleanPlace.nearbyDestinations) {
          cleanPlace.nearbyDestinations = cleanPlace.nearbyDestinations.map((item: any) => {
            const { imageFile, ...rest } = item
            return rest
          })
        }
        
        return cleanPlace
      })

      // Add placesDetails as JSON (without imageFile properties)
      formDataToSend.append("placesDetails", JSON.stringify(placesDetailsForJSON))

      // Main images - append as "image" for first image and "images" for all
      if (imageFiles.length > 0) {
        imageFiles.forEach((file, index) => {
          if (index === 0) {
            formDataToSend.append("image", file)
          }
          formDataToSend.append("images", file)
        })
      } else if (isEdit && initialData?.image && imageFiles.length === 0) {
        formDataToSend.append("image", initialData.image)
      }

      // Extract and send images from placesDetails
      formData.placesDetails.forEach((place, placeIndex) => {
        // Top Attractions images
        if (place.topAttractions) {
          place.topAttractions.forEach((attraction: any) => {
            if (attraction.imageFile && attraction.imageFile instanceof File) {
              formDataToSend.append("attractionImages", attraction.imageFile)
            }
          })
        }
        
        // Food images
        if (place.food) {
          place.food.forEach((food: any) => {
            if (food.imageFile && food.imageFile instanceof File) {
              formDataToSend.append("foodImages", food.imageFile)
            }
          })
        }
        
        // Hotel images
        if (place.hotels) {
          place.hotels.forEach((hotel: any) => {
            if (hotel.imageFile && hotel.imageFile instanceof File) {
              formDataToSend.append("hotelImages", hotel.imageFile)
            }
          })
        }
        
        // Activity images
        if (place.activities) {
          place.activities.forEach((activity: any) => {
            if (activity.imageFile && activity.imageFile instanceof File) {
              formDataToSend.append("activityImages", activity.imageFile)
            }
          })
        }
        
        // Event images
        if (place.eventsFestivals) {
          place.eventsFestivals.forEach((event: any) => {
            if (event.imageFile && event.imageFile instanceof File) {
              formDataToSend.append("eventImages", event.imageFile)
            }
          })
        }
        
        // Nearby destination images
        if (place.nearbyDestinations) {
          place.nearbyDestinations.forEach((nearby: any) => {
            if (nearby.imageFile && nearby.imageFile instanceof File) {
              formDataToSend.append("nearbyImages", nearby.imageFile)
            }
          })
        }
      })

      const url = isEdit && initialData?._id
        ? `${API_BASE}/update/${initialData._id}`
        : `${API_BASE}/add`

      const method = isEdit && initialData?._id ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        body: formDataToSend,
      })

      const result = await response.json()

      if (result.status || result.success) {
        toast({
          title: "Success",
          description: isEdit ? "Season destination updated successfully" : "Season destination added successfully",
        })
        router.push("/admin/explore-destination?tab=season")
      } else {
        throw new Error(result.message || "Failed to save destination")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save destination",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="title">Month *</Label>
              <select
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                required
                disabled={!!formData.title || isEdit}
              >
                <option value="">Select Month</option>
                <option value="January">January</option>
                <option value="February">February</option>
                <option value="March">March</option>
                <option value="April">April</option>
                <option value="May">May</option>
                <option value="June">June</option>
                <option value="July">July</option>
                <option value="August">August</option>
                <option value="September">September</option>
                <option value="October">October</option>
                <option value="November">November</option>
                <option value="December">December</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc">Description *</Label>
              <Textarea
                id="desc"
                value={formData.desc}
                onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                placeholder="e.g., Perfect weather, clear skies, fresh landscapes & festivals."
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Goa, Rajasthan, Kerala, Darjeeling, Mussoorie"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Main Images {!isEdit ? "*" : ""}</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                required={!isEdit && imagePreviews.length === 0}
              />
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="h-20 w-full rounded object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-0 right-0 h-5 w-5 rounded-full bg-red-500 hover:bg-red-600 z-10 shadow-md"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3 text-white" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status only in edit mode */}
            {isEdit && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as "active" | "inactive" })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            )}
          </div>

          <Separator />

          {/* Places Details Section */}
          <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Place Details</h3>
                <Button type="button" onClick={addPlace} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Place
                </Button>
              </div>


            {formData.placesDetails.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No places added yet. Click "Add Place" to start.
                </CardContent>
              </Card>
            ) : (
              <Accordion type="multiple" value={Array.from(expandedPlaces).map(String)} onValueChange={(values) => setExpandedPlaces(new Set(values.map(Number)))}>
                {formData.placesDetails.map((place, placeIndex) => (
                  <AccordionItem key={`place-${placeIndex}`} value={placeIndex.toString()}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span className="font-semibold">
                            {place.placeName || `Place ${placeIndex + 1}`}
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <PlaceDetailForm
                        place={formData.placesDetails[placeIndex]}
                        placeIndex={placeIndex}
                        updatePlaceDetail={updatePlaceDetail}
                        removePlace={removePlace}
                        seasonMonth={formData.title}
                      />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isEdit ? "Updating..." : "Adding..."}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEdit ? "Update Destination" : "Add Destination"}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// Place Detail Form Component
function PlaceDetailForm({ place, placeIndex, updatePlaceDetail, removePlace, seasonMonth }: {
  place: PlaceDetail
  placeIndex: number
  updatePlaceDetail: (index: number, field: keyof PlaceDetail, value: any) => void
  removePlace: (index: number) => void
  seasonMonth?: string
}) {
  const [localPlace, setLocalPlace] = useState(() => ({
    ...place,
    topAttractions: [...(place.topAttractions || [])],
    food: [...(place.food || [])],
    hotels: [...(place.hotels || [])],
    activities: [...(place.activities || [])],
    eventsFestivals: [...(place.eventsFestivals || [])],
    nearbyDestinations: [...(place.nearbyDestinations || [])],
    images: [...(place.images || [])]
  }))
  const [placeImageFiles, setPlaceImageFiles] = useState<File[]>([])
  const [attractionForm, setAttractionForm] = useState({ name: "", description: "", image: null as File | null })
  const [activityForm, setActivityForm] = useState({ name: "", type: "", description: "", image: null as File | null, duration: "", priceRange: "", location: "" })
  const [eventForm, setEventForm] = useState({ name: "", type: "", description: "", image: null as File | null, month: "", startDate: "", endDate: "", location: "" })
  const [editingAttractionIndex, setEditingAttractionIndex] = useState<number | null>(null)
  const [editingActivityIndex, setEditingActivityIndex] = useState<number | null>(null)
  const [editingEventIndex, setEditingEventIndex] = useState<number | null>(null)
  const [editingFoodIndex, setEditingFoodIndex] = useState<number | null>(null)
  const [editingHotelIndex, setEditingHotelIndex] = useState<number | null>(null)
  const [editingNearbyIndex, setEditingNearbyIndex] = useState<number | null>(null)
  const { toast } = useToast()

  // Helper function to get month date range
  const getMonthDateRange = (monthName: string) => {
    if (!monthName) return { min: "", max: "" }
    
    const monthMap: { [key: string]: number } = {
      "January": 0, "February": 1, "March": 2, "April": 3,
      "May": 4, "June": 5, "July": 6, "August": 7,
      "September": 8, "October": 9, "November": 10, "December": 11
    }
    
    const currentYear = new Date().getFullYear()
    const monthIndex = monthMap[monthName]
    if (monthIndex === undefined) return { min: "", max: "" }
    
    const firstDay = new Date(currentYear, monthIndex, 1)
    const lastDay = new Date(currentYear, monthIndex + 1, 0)
    
    const formatDate = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    return {
      min: formatDate(firstDay),
      max: formatDate(lastDay)
    }
  }

  useEffect(() => {
    setLocalPlace({
      ...place,
      topAttractions: [...(place.topAttractions || [])],
      food: [...(place.food || [])],
      hotels: [...(place.hotels || [])],
      activities: [...(place.activities || [])],
      eventsFestivals: [...(place.eventsFestivals || [])],
      nearbyDestinations: [...(place.nearbyDestinations || [])],
      images: [...(place.images || [])]
    })
    setPlaceImageFiles([])
  }, [placeIndex])

  // Auto-set month and dates when seasonMonth changes
  useEffect(() => {
    if (seasonMonth) {
      const dateRange = getMonthDateRange(seasonMonth)
      setEventForm(prev => ({
        ...prev,
        month: seasonMonth,
        startDate: prev.startDate || dateRange.min,
        endDate: prev.endDate || dateRange.max
      }))
    }
  }, [seasonMonth])

  const updateField = (field: keyof PlaceDetail, value: any) => {
    const updated = { ...localPlace, [field]: value }
    setLocalPlace(updated)
  }

  const updateFieldAndSync = (field: keyof PlaceDetail, value: any) => {
    const updated = { ...localPlace, [field]: value }
    setLocalPlace(updated)
    updatePlaceDetail(placeIndex, field, value)
  }

  const handleFieldBlur = (field: keyof PlaceDetail) => {
    // Sync with parent when user finishes editing
    updatePlaceDetail(placeIndex, field, localPlace[field])
  }


  const addArrayItem = (field: keyof PlaceDetail, item: any) => {
    const current = localPlace[field] as any[]
    const updated = [...current, item]
    setLocalPlace({ ...localPlace, [field]: updated })
    updatePlaceDetail(placeIndex, field, updated)
  }

  const updateArrayItem = (field: keyof PlaceDetail, index: number, item: any) => {
    const current = localPlace[field] as any[]
    const updated = [...current]
    updated[index] = item
    setLocalPlace({ ...localPlace, [field]: updated })
    updatePlaceDetail(placeIndex, field, updated)
  }

  const removeArrayItem = (field: keyof PlaceDetail, index: number) => {
    const current = localPlace[field] as any[]
    const updated = current.filter((_, i) => i !== index)
    setLocalPlace({ ...localPlace, [field]: updated })
    updatePlaceDetail(placeIndex, field, updated)
  }

  const handleActivityImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setActivityForm({ ...activityForm, image: file })
    }
  }

  const editActivity = (index: number) => {
    const activity = localPlace.activities[index]
    setActivityForm({
      name: activity.name || "",
      type: activity.type || "",
      description: activity.description || "",
      image: null,
      duration: activity.duration || "",
      priceRange: activity.priceRange || "",
      location: activity.location || ""
    })
    setEditingActivityIndex(index)
  }

  const addActivity = () => {
    if (!activityForm.name || !activityForm.description || !activityForm.type) {
      toast({
        title: "Validation Error",
        description: "Please fill in activity name, type, and description",
        variant: "destructive",
      })
      return
    }
    const newActivity: { name: string; type: string; description: string; image: string; imageFile?: File; duration?: string; priceRange?: string; location?: string } = {
      name: activityForm.name,
      type: activityForm.type,
      description: activityForm.description,
      image: "",
      duration: activityForm.duration || undefined,
      priceRange: activityForm.priceRange || undefined,
      location: activityForm.location || undefined,
    }
    if (activityForm.image) {
      newActivity.imageFile = activityForm.image
    } else if (editingActivityIndex !== null) {
      // Keep existing image when editing without new upload
      const existing = localPlace.activities[editingActivityIndex]
      newActivity.image = existing.image || ""
      if ((existing as any).imageFile) {
        newActivity.imageFile = (existing as any).imageFile
      }
    }
    
    if (editingActivityIndex !== null) {
      updateArrayItem("activities", editingActivityIndex, newActivity)
      setEditingActivityIndex(null)
      toast({
        title: "Success",
        description: "Activity updated successfully",
      })
    } else {
      addArrayItem("activities", newActivity)
      toast({
        title: "Success",
        description: "Activity added successfully",
      })
    }
    setActivityForm({ name: "", type: "", description: "", image: null, duration: "", priceRange: "", location: "" })
  }

  const handleEventImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setEventForm({ ...eventForm, image: file })
    }
  }

  const editEvent = (index: number) => {
    const event = localPlace.eventsFestivals[index]
    // Parse date range if exists
    let startDate = ""
    let endDate = ""
    if (event.date) {
      if (event.date.includes(" - ")) {
        const dates = event.date.split(" - ")
        startDate = dates[0]
        endDate = dates[1] || ""
      } else {
        startDate = event.date
      }
    }
    // Use seasonMonth if available, otherwise use event.month
    const monthToUse = seasonMonth || event.month || ""
    const dateRange = monthToUse ? getMonthDateRange(monthToUse) : { min: "", max: "" }
    
    setEventForm({
      name: event.name || "",
      type: event.type || "",
      description: event.description || "",
      image: null,
      month: monthToUse,
      startDate: startDate || dateRange.min,
      endDate: endDate || dateRange.max,
      location: event.location || ""
    })
    setEditingEventIndex(index)
  }

  const addEvent = () => {
    if (!eventForm.name || !eventForm.description || !eventForm.type) {
      toast({
        title: "Validation Error",
        description: "Please fill in event/festival name, type, and description",
        variant: "destructive",
      })
      return
    }
    // Format date range string
    let dateRangeString = undefined
    if (eventForm.startDate && eventForm.endDate) {
      dateRangeString = `${eventForm.startDate} - ${eventForm.endDate}`
    } else if (eventForm.startDate) {
      dateRangeString = eventForm.startDate
    }
    
    // Use seasonMonth if available, otherwise use eventForm.month
    const monthToUse = seasonMonth || eventForm.month || undefined
    
    const newEvent: { name: string; type: string; description: string; image: string; imageFile?: File; month?: string; date?: string; location?: string } = {
      name: eventForm.name,
      type: eventForm.type,
      description: eventForm.description,
      image: "",
      month: monthToUse,
      date: dateRangeString || undefined,
      location: eventForm.location || undefined,
    }
    if (eventForm.image) {
      newEvent.imageFile = eventForm.image
    } else if (editingEventIndex !== null) {
      // Keep existing image when editing without new upload
      const existing = localPlace.eventsFestivals[editingEventIndex]
      newEvent.image = existing.image || ""
      if ((existing as any).imageFile) {
        newEvent.imageFile = (existing as any).imageFile
      }
    }
    
    if (editingEventIndex !== null) {
      updateArrayItem("eventsFestivals", editingEventIndex, newEvent)
      setEditingEventIndex(null)
      toast({
        title: "Success",
        description: "Event/Festival updated successfully",
      })
    } else {
      addArrayItem("eventsFestivals", newEvent)
      toast({
        title: "Success",
        description: "Event/Festival added successfully",
      })
    }
    // Reset form but keep month if seasonMonth is set
    const monthDateRange = seasonMonth ? getMonthDateRange(seasonMonth) : { min: "", max: "" }
    setEventForm({ 
      name: "", 
      type: "", 
      description: "", 
      image: null, 
      month: seasonMonth || "", 
      startDate: monthDateRange.min, 
      endDate: monthDateRange.max, 
      location: "" 
    })
  }

  const handleAttractionImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAttractionForm({ ...attractionForm, image: file })
    }
  }

  const editAttraction = (index: number) => {
    const attraction = localPlace.topAttractions[index]
    setAttractionForm({
      name: attraction.name || "",
      description: attraction.description || "",
      image: null
    })
    setEditingAttractionIndex(index)
  }

  const addAttraction = () => {
    if (!attractionForm.name || !attractionForm.description) {
      toast({
        title: "Validation Error",
        description: "Please fill in attraction name and description",
        variant: "destructive",
      })
      return
    }
    if (!attractionForm.image && editingAttractionIndex === null) {
      toast({
        title: "Validation Error",
        description: "Please upload an image",
        variant: "destructive",
      })
      return
    }
    const newAttraction: { name: string; description: string; image: string; imageFile?: File } = {
      name: attractionForm.name,
      description: attractionForm.description,
      image: "",
    }
    if (attractionForm.image) {
      newAttraction.imageFile = attractionForm.image
    } else if (editingAttractionIndex !== null) {
      // Keep existing image when editing without new upload
      const existing = localPlace.topAttractions[editingAttractionIndex]
      newAttraction.image = existing.image || ""
      if ((existing as any).imageFile) {
        newAttraction.imageFile = (existing as any).imageFile
      }
    }
    
    if (editingAttractionIndex !== null) {
      updateArrayItem("topAttractions", editingAttractionIndex, newAttraction)
      setEditingAttractionIndex(null)
      toast({
        title: "Success",
        description: "Attraction updated successfully",
      })
    } else {
      addArrayItem("topAttractions", newAttraction)
      toast({
        title: "Success",
        description: "Attraction added successfully",
      })
    }
    setAttractionForm({ name: "", description: "", image: null })
  }

  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Place Information</h4>
        <Button type="button" variant="destructive" size="sm" onClick={() => removePlace(placeIndex)}>
          <Trash2 className="h-4 w-4 mr-2" />
          Remove Place
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Place Name *</Label>
          <Input
            value={localPlace.placeName || ""}
            onChange={(e) => updateField("placeName", e.target.value)}
            onBlur={() => handleFieldBlur("placeName")}
            placeholder="e.g., Himachal Pradesh"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Weather Information</Label>
        <Textarea
          value={localPlace.weatherInfo || ""}
          onChange={(e) => updateField("weatherInfo", e.target.value)}
          onBlur={() => handleFieldBlur("weatherInfo")}
          placeholder="Weather details for this place..."
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={localPlace.description || ""}
          onChange={(e) => updateField("description", e.target.value)}
          onBlur={() => handleFieldBlur("description")}
          placeholder="Enter description for this destination..."
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label>Place Images</Label>
        <Input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files || [])
            if (files.length > 0) {
              setPlaceImageFiles([...placeImageFiles, ...files])
              const imageUrls = files.map(file => URL.createObjectURL(file))
              updateField("images", [...(localPlace.images || []), ...imageUrls])
            }
          }}
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
          {localPlace.images && localPlace.images.map((image, index) => (
            <div key={index} className="relative">
              <img
                src={image}
                alt={`Place image ${index + 1}`}
                className="h-20 w-full rounded object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6"
                onClick={() => {
                  const updatedImages = localPlace.images.filter((_, i) => i !== index)
                  updateField("images", updatedImages)
                  // Also remove from placeImageFiles if it's a new file
                  if (index < placeImageFiles.length) {
                    setPlaceImageFiles(placeImageFiles.filter((_, i) => i !== index))
                  }
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Place-specific tabs for all details */}
      <Tabs defaultValue="attractions" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="attractions">Top Attractions</TabsTrigger>
          <TabsTrigger value="food">Food & Local Cuisine</TabsTrigger>
          <TabsTrigger value="hotels">Hotels</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="events">Events & Festival</TabsTrigger>
          <TabsTrigger value="nearby">Nearby</TabsTrigger>
        </TabsList>

        {/* Top Attractions */}
        <TabsContent value="attractions" className="space-y-4 mt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h5 className="font-semibold">Top Attractions</h5>
              <div className="flex gap-2">
                {editingAttractionIndex !== null && (
                  <Button type="button" variant="outline" size="sm" onClick={() => {
                    setEditingAttractionIndex(null)
                    setAttractionForm({ name: "", description: "", image: null })
                  }}>
                    Cancel
                  </Button>
                )}
                <Button type="button" onClick={addAttraction} size="sm">
                  {editingAttractionIndex !== null ? (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Attraction
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Attraction
                    </>
                  )}
                </Button>
              </div>
            </div>

            <Card className="p-4 bg-muted/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Attraction Name</Label>
                  <Input
                    value={attractionForm.name}
                    onChange={(e) => setAttractionForm({ ...attractionForm, name: e.target.value })}
                    placeholder="Enter attraction name"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={attractionForm.description}
                    onChange={(e) => setAttractionForm({ ...attractionForm, description: e.target.value })}
                    placeholder="Enter description"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Image *</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleAttractionImageChange}
                  />
                  {attractionForm.image && (
                    <img
                      src={URL.createObjectURL(attractionForm.image)}
                      alt="Preview"
                      className="h-20 w-full rounded object-cover mt-2"
                    />
                  )}
                  {!attractionForm.image && editingAttractionIndex !== null && localPlace.topAttractions[editingAttractionIndex]?.image && typeof localPlace.topAttractions[editingAttractionIndex].image === "string" && (
                    <img
                      src={localPlace.topAttractions[editingAttractionIndex].image}
                      alt="Current"
                      className="h-20 w-full rounded object-cover mt-2"
                    />
                  )}
                </div>
              </div>
            </Card>

            <Separator />

            <div className="space-y-2">
              {localPlace.topAttractions.map((attraction, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h6 className="font-semibold">{attraction.name}</h6>
                        </div>
                        {attraction.description && <p className="text-sm text-muted-foreground">{attraction.description}</p>}
                        {(attraction as any).imageFile && (
                          <img src={URL.createObjectURL((attraction as any).imageFile)} alt={attraction.name} className="h-20 w-20 rounded object-cover mt-2" />
                        )}
                        {attraction.image && typeof attraction.image === "string" && !(attraction as any).imageFile && (
                          <img src={attraction.image} alt={attraction.name} className="h-20 w-20 rounded object-cover mt-2" />
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" variant="ghost" size="icon" onClick={() => editAttraction(index)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeArrayItem("topAttractions", index)}>
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {localPlace.topAttractions.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No attractions added yet</p>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Food */}
        <TabsContent value="food" className="mt-4">
          <FoodSection
            items={localPlace.food}
            onAdd={(item) => addArrayItem("food", item)}
            onRemove={(index) => removeArrayItem("food", index)}
            onUpdate={(index, item) => updateArrayItem("food", index, item)}
          />
        </TabsContent>

        {/* Hotels */}
        <TabsContent value="hotels" className="mt-4">
          <PlaceArraySection
            title="Hotels"
            items={localPlace.hotels}
            onAdd={(item) => addArrayItem("hotels", item)}
            onRemove={(index) => removeArrayItem("hotels", index)}
            onUpdate={(index, item) => updateArrayItem("hotels", index, item)}
            fields={[
              { key: "name", label: "Hotel Name", type: "text" },
              { key: "location", label: "Location", type: "text" },
              { key: "rating", label: "Rating", type: "number" },
              { key: "priceRange", label: "Price Range", type: "text" },
              { key: "description", label: "Description", type: "textarea" },
              { key: "image", label: "Image", type: "text" },
            ]}
          />
        </TabsContent>

        {/* Activities */}
        <TabsContent value="activities" className="space-y-4 mt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Activities & Experiences</h3>
              <div className="flex gap-2">
                {editingActivityIndex !== null && (
                  <Button type="button" variant="outline" size="sm" onClick={() => {
                    setEditingActivityIndex(null)
                    setActivityForm({ name: "", type: "", description: "", image: null, duration: "", priceRange: "", location: "" })
                  }}>
                    Cancel
                  </Button>
                )}
                <Button type="button" onClick={addActivity} size="sm">
                  {editingActivityIndex !== null ? (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Activity
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Activity
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/30">
              <div className="space-y-2">
                <Label>Activity Name *</Label>
                <Input
                  value={activityForm.name}
                  onChange={(e) => setActivityForm({ ...activityForm, name: e.target.value })}
                  placeholder="e.g., Paragliding, Trekking"
                />
              </div>
              <div className="space-y-2">
                <Label>Activity Type *</Label>
                <select
                  value={activityForm.type}
                  onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Select Type</option>
                  <option value="Adventure">Adventure</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Family-Friendly">Family-Friendly</option>
                  <option value="Nature">Nature</option>
                  <option value="Religious">Religious</option>
                  <option value="Wildlife">Wildlife</option>
                  <option value="Water Sports">Water Sports</option>
                  <option value="Trekking">Trekking</option>
                  <option value="Photography">Photography</option>
                  <option value="Shopping">Shopping</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
                <Input
                  value={activityForm.duration}
                  onChange={(e) => setActivityForm({ ...activityForm, duration: e.target.value })}
                  placeholder="e.g., 2 hours, Half day"
                />
              </div>
              <div className="space-y-2">
                <Label>Price Range</Label>
                <Input
                  value={activityForm.priceRange}
                  onChange={(e) => setActivityForm({ ...activityForm, priceRange: e.target.value })}
                  placeholder="e.g., ₹1000 - ₹5000"
                />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={activityForm.location}
                  onChange={(e) => setActivityForm({ ...activityForm, location: e.target.value })}
                  placeholder="Activity location"
                />
              </div>
              <div className="space-y-2 md:col-span-3">
                <Label>Description *</Label>
                <Textarea
                  value={activityForm.description}
                  onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                  placeholder="Activity description"
                  rows={3}
                />
              </div>
              <div className="space-y-2 md:col-span-3">
                <Label>Image</Label>
                <Input type="file" accept="image/*" onChange={handleActivityImageChange} />
                {activityForm.image ? (
                  <img
                    src={URL.createObjectURL(activityForm.image)}
                    alt="Preview"
                    className="h-20 w-full rounded object-cover mt-2"
                  />
                ) : editingActivityIndex !== null && localPlace.activities[editingActivityIndex]?.image && typeof localPlace.activities[editingActivityIndex].image === "string" && !(localPlace.activities[editingActivityIndex] as any).imageFile ? (
                  <img
                    src={localPlace.activities[editingActivityIndex].image}
                    alt="Current"
                    className="h-20 w-full rounded object-cover mt-2"
                  />
                ) : null}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              {localPlace.activities.map((activity, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="h-4 w-4" />
                          <h4 className="font-semibold">{activity.name}</h4>
                          {activity.type && <Badge variant="outline">{activity.type}</Badge>}
                        </div>
                        <div className="flex gap-4 text-sm text-muted-foreground mb-2">
                          {activity.duration && <span>Duration: {activity.duration}</span>}
                          {activity.priceRange && <span>Price: {activity.priceRange}</span>}
                        </div>
                        {activity.location && <p className="text-sm text-muted-foreground mb-1">📍 {activity.location}</p>}
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                        {activity.image && typeof activity.image === "string" && (
                          <img src={activity.image} alt={activity.name} className="h-24 w-full rounded mt-2 object-cover" />
                        )}
                        {(activity as any).imageFile && (
                          <img
                            src={URL.createObjectURL((activity as any).imageFile)}
                            alt={activity.name}
                            className="h-24 w-full rounded mt-2 object-cover"
                          />
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" variant="ghost" size="icon" onClick={() => editActivity(index)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeArrayItem("activities", index)}>
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {localPlace.activities.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No activities added yet</p>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Events & Festival */}
        <TabsContent value="events" className="space-y-4 mt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Events & Festival</h3>
              <div className="flex gap-2">
                {editingEventIndex !== null && (
                  <Button type="button" variant="outline" size="sm" onClick={() => {
                    setEditingEventIndex(null)
                    const dateRange = seasonMonth ? getMonthDateRange(seasonMonth) : { min: "", max: "" }
                    setEventForm({ 
                      name: "", 
                      type: "", 
                      description: "", 
                      image: null, 
                      month: seasonMonth || "", 
                      startDate: dateRange.min, 
                      endDate: dateRange.max, 
                      location: "" 
                    })
                  }}>
                    Cancel
                  </Button>
                )}
                <Button type="button" onClick={addEvent} size="sm">
                  {editingEventIndex !== null ? (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Event/Festival
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Event/Festival
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/30">
              <div className="space-y-2">
                <Label>Event/Festival Name *</Label>
                <Input
                  value={eventForm.name}
                  onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                  placeholder="e.g., Diwali, Holi Festival"
                />
              </div>
              <div className="space-y-2">
                <Label>Type *</Label>
                <select
                  value={eventForm.type}
                  onChange={(e) => setEventForm({ ...eventForm, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Select Type</option>
                  <option value="Festival">Festival</option>
                  <option value="Event">Event</option>
                  <option value="Cultural Celebration">Cultural Celebration</option>
                  <option value="Religious Festival">Religious Festival</option>
                  <option value="Music Festival">Music Festival</option>
                  <option value="Food Festival">Food Festival</option>
                  <option value="Art Festival">Art Festival</option>
                  <option value="Seasonal Festival">Seasonal Festival</option>
                  <option value="Heritage Festival">Heritage Festival</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Month</Label>
                <select
                  value={eventForm.month || seasonMonth || ""}
                  disabled={!!seasonMonth}
                  className="w-full px-3 py-2 border rounded-md bg-muted"
                >
                  <option value="">Select Month</option>
                  <option value="January">January</option>
                  <option value="February">February</option>
                  <option value="March">March</option>
                  <option value="April">April</option>
                  <option value="May">May</option>
                  <option value="June">June</option>
                  <option value="July">July</option>
                  <option value="August">August</option>
                  <option value="September">September</option>
                  <option value="October">October</option>
                  <option value="November">November</option>
                  <option value="December">December</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={eventForm.startDate}
                  onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
                  min={seasonMonth ? getMonthDateRange(seasonMonth).min : undefined}
                  max={seasonMonth ? getMonthDateRange(seasonMonth).max : undefined}
                  onFocus={(e) => {
                    if (seasonMonth && !eventForm.startDate) {
                      const dateRange = getMonthDateRange(seasonMonth)
                      if (dateRange.min) {
                        setEventForm({ ...eventForm, startDate: dateRange.min })
                      }
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={eventForm.endDate}
                  onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                  min={eventForm.startDate || (seasonMonth ? getMonthDateRange(seasonMonth).min : undefined)}
                  max={seasonMonth ? getMonthDateRange(seasonMonth).max : undefined}
                  onFocus={(e) => {
                    if (seasonMonth && !eventForm.endDate) {
                      const dateRange = getMonthDateRange(seasonMonth)
                      if (dateRange.max) {
                        setEventForm({ ...eventForm, endDate: dateRange.max })
                      }
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={eventForm.location}
                  onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                  placeholder="Event location"
                />
              </div>
              <div className="space-y-2 md:col-span-3">
                <Label>Description *</Label>
                <Textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  placeholder="Event/Festival description"
                  rows={3}
                />
              </div>
              <div className="space-y-2 md:col-span-3">
                <Label>Image</Label>
                <Input type="file" accept="image/*" onChange={handleEventImageChange} />
                {eventForm.image ? (
                  <img
                    src={URL.createObjectURL(eventForm.image)}
                    alt="Preview"
                    className="h-20 w-full rounded object-cover mt-2"
                  />
                ) : editingEventIndex !== null && localPlace.eventsFestivals[editingEventIndex]?.image && typeof localPlace.eventsFestivals[editingEventIndex].image === "string" && !(localPlace.eventsFestivals[editingEventIndex] as any).imageFile ? (
                  <img
                    src={localPlace.eventsFestivals[editingEventIndex].image}
                    alt="Current"
                    className="h-20 w-full rounded object-cover mt-2"
                  />
                ) : null}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              {localPlace.eventsFestivals.map((event, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-4 w-4" />
                          <h4 className="font-semibold">{event.name}</h4>
                          {event.type && <Badge variant="outline">{event.type}</Badge>}
                        </div>
                        <div className="flex gap-4 text-sm text-muted-foreground mb-2">
                          {event.month && <span>📅 {event.month}</span>}
                          {event.date && <span>{event.date}</span>}
                        </div>
                        {event.location && <p className="text-sm text-muted-foreground mb-1">📍 {event.location}</p>}
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                        {event.image && typeof event.image === "string" && (
                          <img src={event.image} alt={event.name} className="h-24 w-full rounded mt-2 object-cover" />
                        )}
                        {(event as any).imageFile && (
                          <img
                            src={URL.createObjectURL((event as any).imageFile)}
                            alt={event.name}
                            className="h-24 w-full rounded mt-2 object-cover"
                          />
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" variant="ghost" size="icon" onClick={() => editEvent(index)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeArrayItem("eventsFestivals", index)}>
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {localPlace.eventsFestivals.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No events/festivals added yet</p>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Nearby Destinations */}
        <TabsContent value="nearby" className="mt-4">
          <PlaceArraySection
            title="Nearby Destinations"
            items={localPlace.nearbyDestinations}
            onAdd={(item) => addArrayItem("nearbyDestinations", item)}
            onRemove={(index) => removeArrayItem("nearbyDestinations", index)}
            onUpdate={(index, item) => updateArrayItem("nearbyDestinations", index, item)}
            fields={[
              { key: "name", label: "Destination Name", type: "text" },
              { key: "distance", label: "Distance", type: "text" },
              { key: "description", label: "Description", type: "textarea" },
              { key: "image", label: "Image", type: "text" },
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Reusable component for managing array fields
function PlaceArraySection({ title, items, onAdd, onRemove, onUpdate, fields }: {
  title: string
  items: any[]
  onAdd: (item: any) => void
  onRemove: (index: number) => void
  onUpdate?: (index: number, item: any) => void
  fields: Array<{ key: string; label: string; type: "text" | "textarea" | "number" }>
}) {
  const [newItem, setNewItem] = useState<any>({})
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const { toast } = useToast()

  const handleEdit = (index: number) => {
    const item = items[index]
    const editedItem: any = {}
    fields.forEach(field => {
      editedItem[field.key] = item[field.key] || ""
    })
    editedItem.imageFile = null
    setNewItem(editedItem)
    setEditingIndex(index)
  }

  const handleAdd = () => {
    // Check if at least name/description field is filled
    if (!newItem[fields[0]?.key]) {
      toast({
        title: "Validation Error",
        description: `Please fill in at least ${fields[0]?.label}`,
        variant: "destructive",
      })
      return
    }
    // Check if image field requires file upload (only for new items)
    const imageField = fields.find(f => f.key === "image")
    if (imageField && !newItem.imageFile && editingIndex === null) {
      toast({
        title: "Validation Error",
        description: "Please upload an image",
        variant: "destructive",
      })
      return
    }
    // Prepare item with imageFile
    let itemToAdd
    if (imageField && newItem.imageFile) {
      itemToAdd = { ...newItem, image: "", imageFile: newItem.imageFile }
    } else if (imageField && editingIndex !== null) {
      // Keep existing image when editing without new upload
      const existing = items[editingIndex]
      itemToAdd = { ...newItem, image: existing.image || "", imageFile: (existing as any).imageFile || null }
    } else {
      itemToAdd = newItem
    }
    
    if (editingIndex !== null && onUpdate) {
      onUpdate(editingIndex, itemToAdd)
      setEditingIndex(null)
      toast({ title: "Success", description: `${title.slice(0, -1)} updated successfully` })
    } else {
      onAdd(itemToAdd)
      toast({ title: "Success", description: `${title.slice(0, -1)} added successfully` })
    }
    setNewItem({})
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h5 className="font-semibold">{title}</h5>
        <div className="flex gap-2">
          {editingIndex !== null && (
            <Button type="button" variant="outline" size="sm" onClick={() => {
              setEditingIndex(null)
              setNewItem({})
            }}>
              Cancel
            </Button>
          )}
          <Button type="button" onClick={handleAdd} size="sm">
            {editingIndex !== null ? (
              <>
                <Save className="h-4 w-4 mr-2" />
                Update {title.slice(0, -1)}
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add {title.slice(0, -1)}
              </>
            )}
          </Button>
        </div>
      </div>

      <Card className="p-4 bg-muted/30">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((field) => (
            <div key={field.key} className={field.type === "textarea" || field.key === "image" ? "md:col-span-2" : ""}>
              <Label>{field.label} {field.key === "image" ? "*" : ""}</Label>
              {field.key === "image" ? (
                <div className="space-y-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setNewItem({ ...newItem, imageFile: file })
                      }
                    }}
                  />
                  {newItem.imageFile ? (
                    <img
                      src={URL.createObjectURL(newItem.imageFile)}
                      alt="Preview"
                      className="h-20 w-full rounded object-cover mt-2"
                    />
                  ) : editingIndex !== null && items[editingIndex]?.image && typeof items[editingIndex].image === "string" && !(items[editingIndex] as any).imageFile ? (
                    <img
                      src={items[editingIndex].image}
                      alt="Current"
                      className="h-20 w-full rounded object-cover mt-2"
                    />
                  ) : null}
                </div>
              ) : field.type === "textarea" ? (
                <Textarea
                  value={newItem[field.key] || ""}
                  onChange={(e) => setNewItem({ ...newItem, [field.key]: e.target.value })}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  rows={3}
                />
              ) : field.type === "number" ? (
                <Input
                  type="number"
                  value={newItem[field.key] || ""}
                  onChange={(e) => setNewItem({ ...newItem, [field.key]: e.target.value })}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                />
              ) : (
                <Input
                  value={newItem[field.key] || ""}
                  onChange={(e) => setNewItem({ ...newItem, [field.key]: e.target.value })}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                />
              )}
            </div>
          ))}
        </div>
      </Card>

      <Separator />

      <div className="space-y-2">
        {items.map((item, index) => (
          <Card key={index}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h6 className="font-semibold">{item.name || item[fields[0]?.key] || `Item ${index + 1}`}</h6>
                    {item.type && <Badge variant="outline">{item.type}</Badge>}
                  </div>
                  {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                  {(item as any).imageFile && (
                    <img src={URL.createObjectURL((item as any).imageFile)} alt={item.name || item[fields[0]?.key]} className="h-20 w-20 rounded object-cover mt-2" />
                  )}
                  {item.image && typeof item.image === "string" && !(item as any).imageFile && (
                    <img src={item.image} alt={item.name || item[fields[0]?.key]} className="h-20 w-20 rounded object-cover mt-2" />
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" size="icon" onClick={() => handleEdit(index)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(index)}>
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No {title.toLowerCase()} added yet</p>
        )}
      </div>
    </div>
  )
}

// Custom Food Section Component with Veg/Non-Veg dropdown
function FoodSection({ items, onAdd, onRemove, onUpdate }: {
  items: Array<{ name: string; description: string; image: string; type?: string; vegType?: string; nonVegType?: string }>
  onAdd: (item: any) => void
  onRemove: (index: number) => void
  onUpdate?: (index: number, item: any) => void
}) {
  const [newItem, setNewItem] = useState<any>({ type: "" })
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const { toast } = useToast()

  const handleEdit = (index: number) => {
    const item = items[index]
    setNewItem({
      name: item.name || "",
      description: item.description || "",
      type: item.type || "",
      vegType: item.vegType || "",
      nonVegType: item.nonVegType || "",
      imageFile: null
    })
    setEditingIndex(index)
  }

  const handleAdd = () => {
    if (!newItem.name || !newItem.description) {
      toast({
        title: "Validation Error",
        description: "Please fill in Food Name and Description",
        variant: "destructive",
      })
      return
    }
    if (!newItem.type) {
      toast({
        title: "Validation Error",
        description: "Please select Type (Veg or Non-Veg)",
        variant: "destructive",
      })
      return
    }
    if (!newItem.imageFile && editingIndex === null) {
      toast({
        title: "Validation Error",
        description: "Please upload an image",
        variant: "destructive",
      })
      return
    }
    const itemToAdd = { ...newItem, image: "", imageFile: newItem.imageFile }
    if (!itemToAdd.imageFile && editingIndex !== null) {
      // Keep existing image when editing without new upload
      const existing = items[editingIndex]
      itemToAdd.image = existing.image || ""
      if ((existing as any).imageFile) {
        itemToAdd.imageFile = (existing as any).imageFile
      }
    }
    
    if (editingIndex !== null && onUpdate) {
      onUpdate(editingIndex, itemToAdd)
      setEditingIndex(null)
      toast({ title: "Success", description: "Food item updated successfully" })
    } else {
      onAdd(itemToAdd)
      toast({ title: "Success", description: "Food item added successfully" })
    }
    setNewItem({ type: "" })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h5 className="font-semibold">Food & Local Cuisine</h5>
        <div className="flex gap-2">
          {editingIndex !== null && (
            <Button type="button" variant="outline" size="sm" onClick={() => {
              setEditingIndex(null)
              setNewItem({ type: "" })
            }}>
              Cancel
            </Button>
          )}
          <Button type="button" onClick={handleAdd} size="sm">
            {editingIndex !== null ? (
              <>
                <Save className="h-4 w-4 mr-2" />
                Update Food Item
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Food Item
              </>
            )}
          </Button>
        </div>
      </div>

      <Card className="p-4 bg-muted/30">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Food Name *</Label>
            <Input
              value={newItem.name || ""}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              placeholder="Enter food name"
            />
          </div>
          <div className="space-y-2">
            <Label>Type *</Label>
            <select
              value={newItem.type || ""}
              onChange={(e) => setNewItem({ ...newItem, type: e.target.value, vegType: e.target.value === "Veg" ? newItem.vegType : undefined, nonVegType: e.target.value === "Non-Veg" ? newItem.nonVegType : undefined })}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">Select Type</option>
              <option value="Veg">Veg</option>
              <option value="Non-Veg">Non-Veg</option>
            </select>
          </div>
          {newItem.type === "Veg" && (
            <div className="space-y-2 md:col-span-2">
              <Label>Veg Type</Label>
              <Input
                value={newItem.vegType || ""}
                onChange={(e) => setNewItem({ ...newItem, vegType: e.target.value })}
                placeholder="e.g., North Indian, South Indian, Gujarati, Rajasthani, etc."
              />
            </div>
          )}
          {newItem.type === "Non-Veg" && (
            <div className="space-y-2 md:col-span-2">
              <Label>Non-Veg Type</Label>
              <Input
                value={newItem.nonVegType || ""}
                onChange={(e) => setNewItem({ ...newItem, nonVegType: e.target.value })}
                placeholder="e.g., Chicken, Mutton, Seafood, Fish, etc."
              />
            </div>
          )}
          <div className="space-y-2 md:col-span-2">
            <Label>Description *</Label>
            <Textarea
              value={newItem.description || ""}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              placeholder="Food description"
              rows={3}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Image *</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  setNewItem({ ...newItem, imageFile: file })
                }
              }}
            />
            {newItem.imageFile ? (
              <img
                src={URL.createObjectURL(newItem.imageFile)}
                alt="Preview"
                className="h-20 w-full rounded object-cover mt-2"
              />
            ) : editingIndex !== null && items[editingIndex]?.image && typeof items[editingIndex].image === "string" && !(items[editingIndex] as any).imageFile ? (
              <img
                src={items[editingIndex].image}
                alt="Current"
                className="h-20 w-full rounded object-cover mt-2"
              />
            ) : null}
          </div>
        </div>
      </Card>

      <Separator />

      <div className="space-y-2">
        {items.map((item, index) => (
          <Card key={index}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h6 className="font-semibold">{item.name || `Food Item ${index + 1}`}</h6>
                    {item.type && <Badge variant="outline">{item.type}</Badge>}
                    {item.type === "Veg" && item.vegType && (
                      <Badge variant="secondary">{item.vegType}</Badge>
                    )}
                    {item.type === "Non-Veg" && item.nonVegType && (
                      <Badge variant="secondary">{item.nonVegType}</Badge>
                    )}
                  </div>
                  {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                  {item.image && typeof item.image === "string" && !(item as any).imageFile && (
                    <img src={item.image} alt={item.name} className="h-20 w-20 rounded object-cover mt-2" />
                  )}
                  {(item as any).imageFile && (
                    <img
                      src={URL.createObjectURL((item as any).imageFile)}
                      alt={item.name}
                      className="h-20 w-20 rounded object-cover mt-2"
                    />
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" size="icon" onClick={() => handleEdit(index)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(index)}>
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No food items added yet</p>
        )}
      </div>
    </div>
  )
}
