"use client"

import { useState, useEffect } from "react"
import { Plus, Upload, X, Star, Utensils, Hotel, MapPinned, Save, Activity, Calendar, Edit } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"

interface TopAttraction {
  name: string
  image: string
  description: string
  imageFile?: File
}

interface Hotel {
  name: string
  description: string
  image: string
  rating?: number
  priceRange?: string
  location?: string
  imageFile?: File
}

interface FoodItem {
  name: string
  description: string
  image: string
  type?: string // "Veg" or "Non-Veg"
  vegType?: string // e.g., "North Indian", "South Indian", etc. (only if type is "Veg")
  nonVegType?: string // e.g., "Chicken", "Mutton", "Seafood", etc. (only if type is "Non-Veg")
  imageFile?: File
}

interface NearbyDestination {
  name: string
  distance: string
  description: string
  image: string
}

interface Activity {
  name: string
  type: string
  description: string
  image: string
  duration?: string
  priceRange?: string
  location?: string
}

interface EventFestival {
  name: string
  type: string
  description: string
  image: string
  month?: string
  date?: string
  location?: string
}

interface PopularDestinationFormProps {
  initialData?: any
  isEdit?: boolean
}

import { API_BASE_URL } from "@/lib/config"

const API_BASE = `${API_BASE_URL}/api/admin/destination`

export function PopularDestinationForm({ initialData, isEdit = false }: PopularDestinationFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    bestTimeToVisit: "",
    type: "popular",
    status: "active" as "active" | "inactive",
    weatherInfo: "",
    topAttractions: [] as TopAttraction[],
    hotels: [] as Hotel[],
    foodAndCuisine: [] as FoodItem[],
    nearbyDestinations: [] as (NearbyDestination & { imageFile?: File })[],
    activities: [] as (Activity & { imageFile?: File })[],
    eventsFestivals: [] as (EventFestival & { imageFile?: File })[],
  })

  // Individual form states for adding items
  const [attractionForm, setAttractionForm] = useState({ name: "", description: "", image: null as File | null })
  const [hotelForm, setHotelForm] = useState({ name: "", description: "", image: null as File | null, rating: "", priceRange: "", location: "" })
  const [foodForm, setFoodForm] = useState({ name: "", description: "", image: null as File | null, type: "", vegType: "", nonVegType: "" })
  const [nearbyForm, setNearbyForm] = useState({ name: "", distance: "", description: "", image: null as File | null })
  const [activityForm, setActivityForm] = useState({ name: "", type: "", description: "", image: null as File | null, duration: "", priceRange: "", location: "" })
  const [eventForm, setEventForm] = useState({ name: "", type: "", description: "", image: null as File | null, month: "", startDate: "", endDate: "", location: "" })
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  
  // Editing state variables
  const [editingAttractionIndex, setEditingAttractionIndex] = useState<number | null>(null)
  const [editingHotelIndex, setEditingHotelIndex] = useState<number | null>(null)
  const [editingFoodIndex, setEditingFoodIndex] = useState<number | null>(null)
  const [editingNearbyIndex, setEditingNearbyIndex] = useState<number | null>(null)
  const [editingActivityIndex, setEditingActivityIndex] = useState<number | null>(null)
  const [editingEventIndex, setEditingEventIndex] = useState<number | null>(null)
  
  // Ref keys for file inputs to reset them
  const [attractionImageKey, setAttractionImageKey] = useState(0)
  const [hotelImageKey, setHotelImageKey] = useState(0)
  const [foodImageKey, setFoodImageKey] = useState(0)
  const [nearbyImageKey, setNearbyImageKey] = useState(0)
  const [activityImageKey, setActivityImageKey] = useState(0)
  const [eventImageKey, setEventImageKey] = useState(0)

  useEffect(() => {
    if (initialData && isEdit) {
      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
        location: initialData.location || "",
        bestTimeToVisit: initialData.bestTimeToVisit || "",
        type: "popular",
        status: initialData.status || "active",
        weatherInfo: initialData.weatherInfo || "",
        topAttractions: initialData.topAttractions || [],
        hotels: initialData.hotels || [],
        foodAndCuisine: initialData.foodAndCuisine || [],
        nearbyDestinations: initialData.nearbyDestinations || [],
        activities: initialData.activities || [],
        eventsFestivals: initialData.eventsFestivals || [],
      })
      
      // Handle images properly to avoid duplicates
      let imagesToSet: string[] = []
      
      if (initialData.images && Array.isArray(initialData.images) && initialData.images.length > 0) {
        imagesToSet = initialData.images.filter((img: string) => 
          img && typeof img === "string" && img.length > 0
        )
      } else if (initialData.image && typeof initialData.image === "string" && initialData.image.length > 0) {
        imagesToSet = [initialData.image]
      }
      
      // Remove duplicates
      const uniqueImages = Array.from(new Set(imagesToSet))
      setImagePreviews(uniqueImages)
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
    const existingImagesCount = initialData?.images?.length || 0
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




  const handleNearbyImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setNearbyForm({ ...nearbyForm, image: file })
    }
  }

  const handleActivityImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setActivityForm({ ...activityForm, image: file })
    }
  }

  const handleEventImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setEventForm({ ...eventForm, image: file })
    }
  }

  const handleAttractionImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAttractionForm({ ...attractionForm, image: file })
    }
  }

  const handleHotelImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setHotelForm({ ...hotelForm, image: file })
    }
  }

  const handleFoodImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFoodForm({ ...foodForm, image: file })
    }
  }

  const editAttraction = (index: number) => {
    const attraction = formData.topAttractions[index]
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
    // Image is optional - removed required validation
    const newAttraction: TopAttraction = {
      name: attractionForm.name,
      description: attractionForm.description,
      image: "",
    }
    if (attractionForm.image) {
      newAttraction.imageFile = attractionForm.image
    } else if (editingAttractionIndex !== null) {
      // Keep existing image when editing without new upload
      const existing = formData.topAttractions[editingAttractionIndex]
      newAttraction.image = existing.image || ""
      if (existing.imageFile) {
        newAttraction.imageFile = existing.imageFile
      }
    }
    
    if (editingAttractionIndex !== null) {
      const updated = [...formData.topAttractions]
      updated[editingAttractionIndex] = newAttraction
      setFormData({ ...formData, topAttractions: updated })
      setEditingAttractionIndex(null)
      toast({
        title: "Success",
        description: "Attraction updated successfully",
      })
    } else {
      setFormData({
        ...formData,
        topAttractions: [...formData.topAttractions, newAttraction],
      })
      toast({
        title: "Success",
        description: "Attraction added successfully",
      })
    }
    setAttractionForm({ name: "", description: "", image: null })
    setAttractionImageKey(prev => prev + 1) // Reset file input
  }

  const removeAttraction = (index: number) => {
    setFormData({
      ...formData,
      topAttractions: formData.topAttractions.filter((_, i) => i !== index),
    })
  }

  const editHotel = (index: number) => {
    const hotel = formData.hotels[index]
    setHotelForm({
      name: hotel.name || "",
      description: hotel.description || "",
      image: null,
      rating: hotel.rating?.toString() || "",
      priceRange: hotel.priceRange || "",
      location: hotel.location || ""
    })
    setEditingHotelIndex(index)
  }

  const addHotel = () => {
    if (!hotelForm.name || !hotelForm.description) {
      toast({
        title: "Validation Error",
        description: "Please fill in hotel name and description",
        variant: "destructive",
      })
      return
    }
    // Image is optional - removed required validation
    const newHotel: Hotel = {
      name: hotelForm.name,
      description: hotelForm.description,
      image: "",
      rating: hotelForm.rating ? parseFloat(hotelForm.rating) : undefined,
      priceRange: hotelForm.priceRange || undefined,
      location: hotelForm.location || undefined,
    }
    if (hotelForm.image) {
      newHotel.imageFile = hotelForm.image
    } else if (editingHotelIndex !== null) {
      // Keep existing image when editing without new upload
      const existing = formData.hotels[editingHotelIndex]
      newHotel.image = existing.image || ""
      if (existing.imageFile) {
        newHotel.imageFile = existing.imageFile
      }
    }
    
    if (editingHotelIndex !== null) {
      const updated = [...formData.hotels]
      updated[editingHotelIndex] = newHotel
      setFormData({ ...formData, hotels: updated })
      setEditingHotelIndex(null)
      toast({
        title: "Success",
        description: "Hotel updated successfully",
      })
    } else {
      setFormData({
        ...formData,
        hotels: [...formData.hotels, newHotel],
      })
      toast({
        title: "Success",
        description: "Hotel added successfully",
      })
    }
    setHotelForm({ name: "", description: "", image: null, rating: "", priceRange: "", location: "" })
    setHotelImageKey(prev => prev + 1) // Reset file input
  }

  const removeHotel = (index: number) => {
    setFormData({
      ...formData,
      hotels: formData.hotels.filter((_, i) => i !== index),
    })
  }

  const addFood = () => {
    if (!foodForm.name || !foodForm.description) {
      toast({
        title: "Validation Error",
        description: "Please fill in Food Name and Description",
        variant: "destructive",
      })
      return
    }
    if (!foodForm.type) {
      toast({
        title: "Validation Error",
        description: "Please select Type (Veg or Non-Veg)",
        variant: "destructive",
      })
      return
    }
    // Image is optional - removed required validation
    const newFood: FoodItem = {
      name: foodForm.name,
      description: foodForm.description,
      image: "",
      type: foodForm.type,
      vegType: foodForm.type === "Veg" ? foodForm.vegType : undefined,
      nonVegType: foodForm.type === "Non-Veg" ? foodForm.nonVegType : undefined,
    }
    if (foodForm.image) {
      newFood.imageFile = foodForm.image
    } else if (editingFoodIndex !== null) {
      // Keep existing image when editing without new upload
      const existing = formData.foodAndCuisine[editingFoodIndex]
      newFood.image = existing.image || ""
      if (existing.imageFile) {
        newFood.imageFile = existing.imageFile
      }
    }
    
    if (editingFoodIndex !== null) {
      const updated = [...formData.foodAndCuisine]
      updated[editingFoodIndex] = newFood
      setFormData({ ...formData, foodAndCuisine: updated })
      setEditingFoodIndex(null)
      toast({
        title: "Success",
        description: "Food item updated successfully",
      })
    } else {
      setFormData({
        ...formData,
        foodAndCuisine: [...formData.foodAndCuisine, newFood],
      })
      toast({
        title: "Success",
        description: "Food item added successfully",
      })
    }
    setFoodForm({ name: "", description: "", image: null, type: "", vegType: "", nonVegType: "" })
    setFoodImageKey(prev => prev + 1) // Reset file input
  }

  const editFood = (index: number) => {
    const food = formData.foodAndCuisine[index]
    setFoodForm({
      name: food.name || "",
      description: food.description || "",
      image: null,
      type: food.type || "",
      vegType: food.vegType || "",
      nonVegType: food.nonVegType || ""
    })
    setEditingFoodIndex(index)
  }

  const removeFood = (index: number) => {
    setFormData({
      ...formData,
      foodAndCuisine: formData.foodAndCuisine.filter((_, i) => i !== index),
    })
  }

  const editNearby = (index: number) => {
    const nearby = formData.nearbyDestinations[index]
    setNearbyForm({
      name: nearby.name || "",
      distance: nearby.distance || "",
      description: nearby.description || "",
      image: null
    })
    setEditingNearbyIndex(index)
  }

  const addNearby = () => {
    if (!nearbyForm.name || !nearbyForm.description || !nearbyForm.distance) {
      toast({
        title: "Validation Error",
        description: "Please fill in nearby destination name, distance, and description",
        variant: "destructive",
      })
      return
    }
    const newNearby: NearbyDestination & { imageFile?: File } = {
      name: nearbyForm.name,
      distance: nearbyForm.distance,
      description: nearbyForm.description,
      image: "",
    }
    if (nearbyForm.image) {
      newNearby.imageFile = nearbyForm.image
    } else if (editingNearbyIndex !== null) {
      // Keep existing image when editing without new upload
      const existing = formData.nearbyDestinations[editingNearbyIndex]
      newNearby.image = existing.image || ""
      if (existing.imageFile) {
        newNearby.imageFile = existing.imageFile
      }
    }
    
    if (editingNearbyIndex !== null) {
      const updated = [...formData.nearbyDestinations]
      updated[editingNearbyIndex] = newNearby
      setFormData({ ...formData, nearbyDestinations: updated })
      setEditingNearbyIndex(null)
      toast({
        title: "Success",
        description: "Nearby destination updated successfully",
      })
    } else {
      setFormData({
        ...formData,
        nearbyDestinations: [...formData.nearbyDestinations, newNearby],
      })
      toast({
        title: "Success",
        description: "Nearby destination added successfully",
      })
    }
    setNearbyForm({ name: "", distance: "", description: "", image: null })
    setNearbyImageKey(prev => prev + 1) // Reset file input
  }

  const removeNearby = (index: number) => {
    setFormData({
      ...formData,
      nearbyDestinations: formData.nearbyDestinations.filter((_, i) => i !== index),
    })
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
    const newActivity: Activity & { imageFile?: File } = {
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
      const existing = formData.activities[editingActivityIndex]
      newActivity.image = existing.image || ""
      if (existing.imageFile) {
        newActivity.imageFile = existing.imageFile
      }
    }
    
    if (editingActivityIndex !== null) {
      const updated = [...formData.activities]
      updated[editingActivityIndex] = newActivity
      setFormData({ ...formData, activities: updated })
      setEditingActivityIndex(null)
      toast({
        title: "Success",
        description: "Activity updated successfully",
      })
    } else {
      setFormData({
        ...formData,
        activities: [...formData.activities, newActivity],
      })
      toast({
        title: "Success",
        description: "Activity added successfully",
      })
    }
    setActivityForm({ name: "", type: "", description: "", image: null, duration: "", priceRange: "", location: "" })
    setActivityImageKey(prev => prev + 1) // Reset file input
  }

  const editActivity = (index: number) => {
    const activity = formData.activities[index]
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

  const removeActivity = (index: number) => {
    setFormData({
      ...formData,
      activities: formData.activities.filter((_, i) => i !== index),
    })
  }

  const editEvent = (index: number) => {
    const event = formData.eventsFestivals[index]
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
    setEventForm({
      name: event.name || "",
      type: event.type || "",
      description: event.description || "",
      image: null,
      month: event.month || "",
      startDate: startDate,
      endDate: endDate,
      location: event.location || ""
    })
    setEditingEventIndex(index)
  }

  // Helper function to get date range for selected month
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

  const addEvent = () => {
    if (!eventForm.name || !eventForm.description || !eventForm.type) {
      toast({
        title: "Validation Error",
        description: "Please fill in event/festival name, type, and description",
        variant: "destructive",
      })
      return
    }
    // Format date range
    let dateRange = undefined
    if (eventForm.startDate && eventForm.endDate) {
      dateRange = `${eventForm.startDate} - ${eventForm.endDate}`
    } else if (eventForm.startDate) {
      dateRange = eventForm.startDate
    }
    
    const newEvent: EventFestival & { imageFile?: File } = {
      name: eventForm.name,
      type: eventForm.type,
      description: eventForm.description,
      image: "",
      month: eventForm.month || undefined,
      date: dateRange || undefined,
      location: eventForm.location || undefined,
    }
    if (eventForm.image) {
      newEvent.imageFile = eventForm.image
    } else if (editingEventIndex !== null) {
      // Keep existing image when editing without new upload
      const existing = formData.eventsFestivals[editingEventIndex]
      newEvent.image = existing.image || ""
      if (existing.imageFile) {
        newEvent.imageFile = existing.imageFile
      }
    }
    
    if (editingEventIndex !== null) {
      const updated = [...formData.eventsFestivals]
      updated[editingEventIndex] = newEvent
      setFormData({ ...formData, eventsFestivals: updated })
      setEditingEventIndex(null)
      toast({
        title: "Success",
        description: "Event/Festival updated successfully",
      })
    } else {
      setFormData({
        ...formData,
        eventsFestivals: [...formData.eventsFestivals, newEvent],
      })
      toast({
        title: "Success",
        description: "Event/Festival added successfully",
      })
    }
    setEventForm({ name: "", type: "", description: "", image: null, month: "", startDate: "", endDate: "", location: "" })
    setEventImageKey(prev => prev + 1) // Reset file input
  }

  const removeEvent = (index: number) => {
    setFormData({
      ...formData,
      eventsFestivals: formData.eventsFestivals.filter((_, i) => i !== index),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.description || !formData.location) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append("name", formData.name)
      formDataToSend.append("description", formData.description)
      formDataToSend.append("location", formData.location)
      formDataToSend.append("bestTimeToVisit", formData.bestTimeToVisit)
      formDataToSend.append("type", "popular")
      // Status is handled automatically by backend for new destinations
      if (isEdit) {
        formDataToSend.append("status", formData.status)
      }
      formDataToSend.append("weatherInfo", formData.weatherInfo || "")

      // Add arrays as JSON (excluding imageFile from JSON)
      formDataToSend.append("topAttractions", JSON.stringify(formData.topAttractions.map(({ imageFile, ...rest }) => rest)))
      formDataToSend.append("hotels", JSON.stringify(formData.hotels.map(({ imageFile, ...rest }) => rest)))
      formDataToSend.append("foodAndCuisine", JSON.stringify(formData.foodAndCuisine.map(({ imageFile, ...rest }) => rest)))
      formDataToSend.append("nearbyDestinations", JSON.stringify(formData.nearbyDestinations.map(({ imageFile, ...rest }) => rest)))
      formDataToSend.append("activities", JSON.stringify(formData.activities.map(({ imageFile, ...rest }) => rest)))
      formDataToSend.append("eventsFestivals", JSON.stringify(formData.eventsFestivals.map(({ imageFile, ...rest }) => rest)))

      // Main images handling
      const existingImageUrls = imagePreviews.filter((img: string) => 
        typeof img === "string" && img.length > 0 && !img.startsWith("blob:")
      )
      
      // Send existing image URLs as JSON array
      if (existingImageUrls.length > 0) {
        formDataToSend.append("images", JSON.stringify(existingImageUrls))
      }
      
      // Send new uploaded files
      if (imageFiles.length > 0) {
        imageFiles.forEach((file) => {
          formDataToSend.append("images", file)
        })
        formDataToSend.append("image", imageFiles[0])
      } else if (existingImageUrls.length > 0) {
        formDataToSend.append("image", existingImageUrls[0])
      }

      // Attraction images
      formData.topAttractions.forEach((attraction: any) => {
        if (attraction.imageFile && attraction.imageFile instanceof File) {
          formDataToSend.append("attractionImages", attraction.imageFile)
        }
      })

      // Hotel images
      formData.hotels.forEach((hotel: any) => {
        if (hotel.imageFile && hotel.imageFile instanceof File) {
          formDataToSend.append("hotelImages", hotel.imageFile)
        }
      })

      // Food images
      formData.foodAndCuisine.forEach((food: any) => {
        if (food.imageFile && food.imageFile instanceof File) {
          formDataToSend.append("foodImages", food.imageFile)
        }
      })

      // Nearby destination images
      formData.nearbyDestinations.forEach((nearby: any) => {
        if (nearby.imageFile && nearby.imageFile instanceof File) {
          formDataToSend.append("nearbyImages", nearby.imageFile)
        }
      })

      // Activity images
      formData.activities.forEach((activity: any) => {
        if (activity.imageFile && activity.imageFile instanceof File) {
          formDataToSend.append("activityImages", activity.imageFile)
        }
      })

      // Event/Festival images
      formData.eventsFestivals.forEach((event: any) => {
        if (event.imageFile && event.imageFile instanceof File) {
          formDataToSend.append("eventImages", event.imageFile)
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
          description: isEdit ? "Destination updated successfully" : "Destination added successfully",
        })
        router.push("/admin/explore-destination")
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
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-8">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="weather">Weather</TabsTrigger>
              <TabsTrigger value="attractions">Attractions</TabsTrigger>
              <TabsTrigger value="food">Food & Local Cuisine</TabsTrigger>
              <TabsTrigger value="hotels">Hotels</TabsTrigger>
              <TabsTrigger value="activities">Activities</TabsTrigger>
              <TabsTrigger value="events">Events & Festivals</TabsTrigger>
              <TabsTrigger value="nearby">Nearby</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter destination name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Enter location"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter description"
                  rows={4}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bestTimeToVisit">Best Time to Visit</Label>
                <Input
                  id="bestTimeToVisit"
                  value={formData.bestTimeToVisit}
                  onChange={(e) => setFormData({ ...formData, bestTimeToVisit: e.target.value })}
                  placeholder="e.g., October to March"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="images">Images</Label>
                <Input id="images" type="file" multiple accept="image/*" onChange={handleImageChange} />
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
            </TabsContent>

            <TabsContent value="weather" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="weatherInfo">Weather Information</Label>
                <Textarea
                  id="weatherInfo"
                  value={formData.weatherInfo}
                  onChange={(e) => setFormData({ ...formData, weatherInfo: e.target.value })}
                  placeholder="Enter weather information and climate details"
                  rows={8}
                />
              </div>
            </TabsContent>

            <TabsContent value="attractions" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="font-semibold">Top Attractions</h5>
                  <div className="flex gap-2">
                    {editingAttractionIndex !== null && (
                      <Button type="button" variant="outline" size="sm" onClick={() => {
                        setEditingAttractionIndex(null)
                        setAttractionForm({ name: "", description: "", image: null })
                        setAttractionImageKey(prev => prev + 1)
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
                      <Label>Image</Label>
                      <Input
                        key={attractionImageKey}
                        type="file"
                        accept="image/*"
                        onChange={handleAttractionImageChange}
                      />
                      {attractionForm.image ? (
                        <img
                          src={URL.createObjectURL(attractionForm.image)}
                          alt="Preview"
                          className="h-20 w-full rounded object-cover mt-2"
                        />
                      ) : editingAttractionIndex !== null && formData.topAttractions[editingAttractionIndex]?.image && typeof formData.topAttractions[editingAttractionIndex].image === "string" && !formData.topAttractions[editingAttractionIndex].imageFile ? (
                        <img
                          src={formData.topAttractions[editingAttractionIndex].image}
                          alt="Current"
                          className="h-20 w-full rounded object-cover mt-2"
                        />
                      ) : null}
                    </div>
                  </div>
                </Card>

                <Separator />

                <div className="space-y-2">
                  {formData.topAttractions.map((attraction, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h6 className="font-semibold">{attraction.name}</h6>
                            </div>
                            {attraction.description && <p className="text-sm text-muted-foreground">{attraction.description}</p>}
                            {attraction.imageFile && (
                              <img src={URL.createObjectURL(attraction.imageFile)} alt={attraction.name} className="h-20 w-20 rounded object-cover mt-2" />
                            )}
                            {attraction.image && !attraction.imageFile && (
                              <img src={attraction.image} alt={attraction.name} className="h-20 w-20 rounded object-cover mt-2" />
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button type="button" variant="ghost" size="icon" onClick={() => editAttraction(index)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeAttraction(index)}>
                              <X className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {formData.topAttractions.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No attractions added yet</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="hotels" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="font-semibold">Hotels</h5>
                  <div className="flex gap-2">
                    {editingHotelIndex !== null && (
                      <Button type="button" variant="outline" size="sm" onClick={() => {
                        setEditingHotelIndex(null)
                        setHotelForm({ name: "", description: "", image: null, rating: "", priceRange: "", location: "" })
                        setHotelImageKey(prev => prev + 1)
                      }}>
                        Cancel
                      </Button>
                    )}
                    <Button type="button" onClick={addHotel} size="sm">
                      {editingHotelIndex !== null ? (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Update Hotel
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Hotel
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <Card className="p-4 bg-muted/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Hotel Name</Label>
                      <Input
                        value={hotelForm.name}
                        onChange={(e) => setHotelForm({ ...hotelForm, name: e.target.value })}
                        placeholder="Enter hotel name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input
                        value={hotelForm.location}
                        onChange={(e) => setHotelForm({ ...hotelForm, location: e.target.value })}
                        placeholder="Hotel location"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Rating</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={hotelForm.rating}
                        onChange={(e) => setHotelForm({ ...hotelForm, rating: e.target.value })}
                        placeholder="Enter rating"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Price Range</Label>
                      <Input
                        value={hotelForm.priceRange}
                        onChange={(e) => setHotelForm({ ...hotelForm, priceRange: e.target.value })}
                        placeholder="Enter price range"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Description</Label>
                      <Textarea
                        value={hotelForm.description}
                        onChange={(e) => setHotelForm({ ...hotelForm, description: e.target.value })}
                        placeholder="Enter description"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Image</Label>
                      <Input
                        key={hotelImageKey}
                        type="file"
                        accept="image/*"
                        onChange={handleHotelImageChange}
                      />
                      {hotelForm.image ? (
                        <img
                          src={URL.createObjectURL(hotelForm.image)}
                          alt="Preview"
                          className="h-20 w-full rounded object-cover mt-2"
                        />
                      ) : editingHotelIndex !== null && formData.hotels[editingHotelIndex]?.image && typeof formData.hotels[editingHotelIndex].image === "string" && !formData.hotels[editingHotelIndex].imageFile ? (
                        <img
                          src={formData.hotels[editingHotelIndex].image}
                          alt="Current"
                          className="h-20 w-full rounded object-cover mt-2"
                        />
                      ) : null}
                    </div>
                  </div>
                </Card>

                <Separator />

                <div className="space-y-2">
                  {formData.hotels.map((hotel, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h6 className="font-semibold">{hotel.name || `Hotel ${index + 1}`}</h6>
                            </div>
                            {hotel.description && <p className="text-sm text-muted-foreground">{hotel.description}</p>}
                            {hotel.imageFile && (
                              <img src={URL.createObjectURL(hotel.imageFile)} alt={hotel.name} className="h-20 w-20 rounded object-cover mt-2" />
                            )}
                            {hotel.image && !hotel.imageFile && (
                              <img src={hotel.image} alt={hotel.name} className="h-20 w-20 rounded object-cover mt-2" />
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button type="button" variant="ghost" size="icon" onClick={() => editHotel(index)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeHotel(index)}>
                              <X className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {formData.hotels.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No hotels added yet</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="food" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="font-semibold">Food & Local Cuisine</h5>
                  <div className="flex gap-2">
                    {editingFoodIndex !== null && (
                      <Button type="button" variant="outline" size="sm" onClick={() => {
                        setEditingFoodIndex(null)
                        setFoodForm({ name: "", description: "", image: null, type: "", vegType: "", nonVegType: "" })
                        setFoodImageKey(prev => prev + 1)
                      }}>
                        Cancel
                      </Button>
                    )}
                    <Button type="button" onClick={addFood} size="sm">
                      {editingFoodIndex !== null ? (
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
                        value={foodForm.name}
                        onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })}
                        placeholder="Enter food name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Type *</Label>
                      <select
                        value={foodForm.type || ""}
                        onChange={(e) =>
                          setFoodForm({
                            ...foodForm,
                            type: e.target.value,
                            vegType: e.target.value === "Veg" ? (foodForm.vegType ?? "") : "",
                            nonVegType: e.target.value === "Non-Veg" ? (foodForm.nonVegType ?? "") : "",
                          })
                        }
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="">Select Type</option>
                        <option value="Veg">Veg</option>
                        <option value="Non-Veg">Non-Veg</option>
                      </select>
                    </div>
                    {foodForm.type === "Veg" && (
                      <div className="space-y-2 md:col-span-2">
                        <Label>Veg Type</Label>
                        <Input
                          value={foodForm.vegType}
                          onChange={(e) => setFoodForm({ ...foodForm, vegType: e.target.value })}
                          placeholder="e.g., North Indian, South Indian, Gujarati, Rajasthani, etc."
                        />
                      </div>
                    )}
                    {foodForm.type === "Non-Veg" && (
                      <div className="space-y-2 md:col-span-2">
                        <Label>Non-Veg Type</Label>
                        <Input
                          value={foodForm.nonVegType}
                          onChange={(e) => setFoodForm({ ...foodForm, nonVegType: e.target.value })}
                          placeholder="e.g., Chicken, Mutton, Seafood, Fish, etc."
                        />
                      </div>
                    )}
                    <div className="space-y-2 md:col-span-2">
                      <Label>Description *</Label>
                      <Textarea
                        value={foodForm.description}
                        onChange={(e) => setFoodForm({ ...foodForm, description: e.target.value })}
                        placeholder="Food description"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Image</Label>
                      <Input
                        key={foodImageKey}
                        type="file"
                        accept="image/*"
                        onChange={handleFoodImageChange}
                      />
                      {foodForm.image ? (
                        <img
                          src={URL.createObjectURL(foodForm.image)}
                          alt="Preview"
                          className="h-20 w-full rounded object-cover mt-2"
                        />
                      ) : editingFoodIndex !== null && formData.foodAndCuisine[editingFoodIndex]?.image && typeof formData.foodAndCuisine[editingFoodIndex].image === "string" && !formData.foodAndCuisine[editingFoodIndex].imageFile ? (
                        <img
                          src={formData.foodAndCuisine[editingFoodIndex].image}
                          alt="Current"
                          className="h-20 w-full rounded object-cover mt-2"
                        />
                      ) : null}
                    </div>
                  </div>
                </Card>

                <Separator />

                <div className="space-y-2">
                  {formData.foodAndCuisine.map((food, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h6 className="font-semibold">{food.name || `Food Item ${index + 1}`}</h6>
                              {food.type && <Badge variant="outline">{food.type}</Badge>}
                              {food.type === "Veg" && food.vegType && (
                                <Badge variant="secondary">{food.vegType}</Badge>
                              )}
                              {food.type === "Non-Veg" && food.nonVegType && (
                                <Badge variant="secondary">{food.nonVegType}</Badge>
                              )}
                            </div>
                            {food.description && <p className="text-sm text-muted-foreground">{food.description}</p>}
                            {food.imageFile && (
                              <img src={URL.createObjectURL(food.imageFile)} alt={food.name} className="h-20 w-20 rounded object-cover mt-2" />
                            )}
                            {food.image && !food.imageFile && (
                              <img src={food.image} alt={food.name} className="h-20 w-20 rounded object-cover mt-2" />
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button type="button" variant="ghost" size="icon" onClick={() => editFood(index)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeFood(index)}>
                              <X className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {formData.foodAndCuisine.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No food items added yet</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="nearby" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Nearby Destinations</h3>
                  <div className="flex gap-2">
                    {editingNearbyIndex !== null && (
                      <Button type="button" variant="outline" size="sm" onClick={() => {
                        setEditingNearbyIndex(null)
                        setNearbyForm({ name: "", distance: "", description: "", image: null })
                        setNearbyImageKey(prev => prev + 1)
                      }}>
                        Cancel
                      </Button>
                    )}
                    <Button type="button" onClick={addNearby} size="sm">
                      {editingNearbyIndex !== null ? (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Update Nearby Destination
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Nearby Destination
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/30">
                  <div className="space-y-2">
                    <Label>Destination Name</Label>
                    <Input
                      value={nearbyForm.name}
                      onChange={(e) => setNearbyForm({ ...nearbyForm, name: e.target.value })}
                      placeholder="Enter destination name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Distance</Label>
                    <Input
                      value={nearbyForm.distance}
                      onChange={(e) => setNearbyForm({ ...nearbyForm, distance: e.target.value })}
                      placeholder="e.g., 50 km"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-3">
                    <Label>Description</Label>
                    <Textarea
                      value={nearbyForm.description}
                      onChange={(e) => setNearbyForm({ ...nearbyForm, description: e.target.value })}
                      placeholder="Destination description"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-3">
                    <Label>Image</Label>
                    <Input key={nearbyImageKey} type="file" accept="image/*" onChange={handleNearbyImageChange} />
                    {nearbyForm.image ? (
                      <img
                        src={URL.createObjectURL(nearbyForm.image)}
                        alt="Preview"
                        className="h-20 w-full rounded object-cover mt-2"
                      />
                    ) : editingNearbyIndex !== null && formData.nearbyDestinations[editingNearbyIndex]?.image && typeof formData.nearbyDestinations[editingNearbyIndex].image === "string" && !(formData.nearbyDestinations[editingNearbyIndex] as any).imageFile ? (
                      <img
                        src={formData.nearbyDestinations[editingNearbyIndex].image}
                        alt="Current"
                        className="h-20 w-full rounded object-cover mt-2"
                      />
                    ) : null}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  {formData.nearbyDestinations.map((nearby, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <MapPinned className="h-4 w-4" />
                              <h4 className="font-semibold">{nearby.name}</h4>
                              {nearby.distance && <Badge variant="outline">{nearby.distance}</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground">{nearby.description}</p>
                            {nearby.image && typeof nearby.image === "string" && (
                              <img src={nearby.image} alt={nearby.name} className="h-24 w-full rounded mt-2 object-cover" />
                            )}
                            {(nearby as any).imageFile && (
                              <img
                                src={URL.createObjectURL((nearby as any).imageFile)}
                                alt={nearby.name}
                                className="h-24 w-full rounded mt-2 object-cover"
                              />
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button type="button" variant="ghost" size="icon" onClick={() => editNearby(index)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeNearby(index)}>
                              <X className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {formData.nearbyDestinations.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No nearby destinations added yet</p>
                  )}
                </div>

                {/* Action buttons - only show in Nearby tab */}
                <div className="flex justify-end gap-4 pt-6 border-t mt-6">
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
              </div>
            </TabsContent>

            <TabsContent value="activities" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Activities & Experiences</h3>
                  <div className="flex gap-2">
                    {editingActivityIndex !== null && (
                      <Button type="button" variant="outline" size="sm" onClick={() => {
                        setEditingActivityIndex(null)
                        setActivityForm({ name: "", type: "", description: "", image: null, duration: "", priceRange: "", location: "" })
                        setActivityImageKey(prev => prev + 1)
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
                    <Input key={activityImageKey} type="file" accept="image/*" onChange={handleActivityImageChange} />
                    {activityForm.image ? (
                      <img
                        src={URL.createObjectURL(activityForm.image)}
                        alt="Preview"
                        className="h-20 w-full rounded object-cover mt-2"
                      />
                    ) : editingActivityIndex !== null && formData.activities[editingActivityIndex]?.image && typeof formData.activities[editingActivityIndex].image === "string" && !(formData.activities[editingActivityIndex] as any).imageFile ? (
                      <img
                        src={formData.activities[editingActivityIndex].image}
                        alt="Current"
                        className="h-20 w-full rounded object-cover mt-2"
                      />
                    ) : null}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  {formData.activities.map((activity, index) => (
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
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeActivity(index)}>
                              <X className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {formData.activities.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No activities added yet</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="events" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Events & Festivals</h3>
                  <div className="flex gap-2">
                    {editingEventIndex !== null && (
                      <Button type="button" variant="outline" size="sm" onClick={() => {
                        setEditingEventIndex(null)
                        setEventForm({ name: "", type: "", description: "", image: null, month: "", startDate: "", endDate: "", location: "" })
                        setEventImageKey(prev => prev + 1)
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
                      value={eventForm.month}
                      onChange={(e) => {
                        const selectedMonth = e.target.value
                        const dateRange = getMonthDateRange(selectedMonth)
                        setEventForm({ 
                          ...eventForm, 
                          month: selectedMonth,
                          // Auto-set start date to first day of month if not set
                          startDate: eventForm.startDate || dateRange.min || "",
                          // Auto-set end date to first day of month if not set
                          endDate: eventForm.endDate || dateRange.min || ""
                        })
                      }}
                      className="w-full px-3 py-2 border rounded-md"
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
                      min={getMonthDateRange(eventForm.month).min}
                      max={getMonthDateRange(eventForm.month).max}
                      onFocus={(e) => {
                        if (eventForm.month && !eventForm.startDate) {
                          const dateRange = getMonthDateRange(eventForm.month)
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
                      min={eventForm.startDate || getMonthDateRange(eventForm.month).min}
                      max={getMonthDateRange(eventForm.month).max}
                      onFocus={(e) => {
                        if (eventForm.month && !eventForm.endDate) {
                          const dateRange = getMonthDateRange(eventForm.month)
                          if (dateRange.min) {
                            setEventForm({ ...eventForm, endDate: dateRange.min })
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
                    <Input key={eventImageKey} type="file" accept="image/*" onChange={handleEventImageChange} />
                    {eventForm.image ? (
                      <img
                        src={URL.createObjectURL(eventForm.image)}
                        alt="Preview"
                        className="h-20 w-full rounded object-cover mt-2"
                      />
                    ) : editingEventIndex !== null && formData.eventsFestivals[editingEventIndex]?.image && typeof formData.eventsFestivals[editingEventIndex].image === "string" && !(formData.eventsFestivals[editingEventIndex] as any).imageFile ? (
                      <img
                        src={formData.eventsFestivals[editingEventIndex].image}
                        alt="Current"
                        className="h-20 w-full rounded object-cover mt-2"
                      />
                    ) : null}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  {formData.eventsFestivals.map((event, index) => (
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
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeEvent(index)}>
                              <X className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {formData.eventsFestivals.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No events/festivals added yet</p>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </form>
      </CardContent>
    </Card>
  )
}

