"use client"

import { useState, useEffect } from "react"
import { Save, X, Plus, MapPin, Trash2, Search, DollarSign, CheckCircle2 } from "lucide-react"
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
import { API_BASE_URL } from "@/lib/config"

interface Destination {
  _id: string
  name?: string
  title?: string
  type: string
  description?: string
  desc?: string
  location?: string
  image?: string
  images?: string[]
  placesDetails?: Array<{
    placeName: string
    topAttractions?: Array<{ name: string; description: string }>
    hotels?: Array<{ name: string }>
    activities?: Array<{ name: string }>
  }>
}

interface SelectedDestination {
  destinationId: string
  destinationName: string
  destinationType: string
  budget: {
    accommodation: number
    food: number
    activities: number
    transport: number
    miscellaneous: number
    total: number
    currency: string
  }
  places: string[] // Places where users can visit
}

interface PackageFormProps {
  initialData?: any
  isEdit?: boolean
}

const PACKAGE_API_BASE = `${API_BASE_URL}/api/admin/packages`
const DESTINATION_API_BASE = `${API_BASE_URL}/api/admin/destination`

export function PackageForm({ initialData, isEdit = false }: PackageFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Package basic info
  const [formData, setFormData] = useState({
    title: "",
    duration: "",
    source: "",
    destination: "",
    overview: "",
    otherDetails: "",
    category: "Other" as "Adventure" | "Family" | "Honeymoon" | "Holiday" | "Cultural" | "Religious" | "Wildlife" | "Beach" | "Hill Station" | "Other",
    highlights: [] as string[],
    inclusions: [] as string[],
    exclusions: [] as string[],
    itinerary: [] as Array<{
      day: number
      title: string
      description: string
      activities?: string[]
      meals?: string
      accommodation?: string
    }>,
    price: {
      adult: 0,
      child: 0,
      infant: 0,
      currency: "INR"
    },
    discount: {
      percentage: 0,
      validFrom: "",
      validUntil: ""
    },
    status: "active" as "active" | "inactive",
    destinations: [] as SelectedDestination[],
    customization: {
      carRentals: {
        available: false,
        options: [] as Array<{ carType: string; pricePerDay: number; description: string }>
      },
      guides: {
        available: false,
        options: [] as Array<{ guideType: string; price: number; description: string }>
      },
      extendedStays: {
        available: false,
        pricePerDay: 0,
        description: ""
      },
      mealPlans: {
        available: false,
        options: [] as Array<{ planType: string; price: number; description: string }>
      }
    }
  })

  // Destination selection
  const [allDestinations, setAllDestinations] = useState<Destination[]>([])
  const [destinationSearch, setDestinationSearch] = useState("")
  const [selectedDestinationIds, setSelectedDestinationIds] = useState<Set<string>>(new Set())
  const [selectedDestinationType, setSelectedDestinationType] = useState<string | null>(null)

  // Form inputs
  const [highlightInput, setHighlightInput] = useState("")
  const [inclusionInput, setInclusionInput] = useState("")
  const [exclusionInput, setExclusionInput] = useState("")
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  // Itinerary
  const [itineraryDay, setItineraryDay] = useState(1)
  const [itineraryTitle, setItineraryTitle] = useState("")
  const [itineraryDescription, setItineraryDescription] = useState("")
  const [itineraryActivities, setItineraryActivities] = useState<string[]>([])
  const [itineraryActivityInput, setItineraryActivityInput] = useState("")
  const [itineraryMeals, setItineraryMeals] = useState("")
  const [itineraryAccommodation, setItineraryAccommodation] = useState("")

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        duration: initialData.duration || "",
        source: initialData.source || "",
        destination: initialData.destination || "",
        overview: initialData.overview || "",
        otherDetails: initialData.otherDetails || "",
        category: initialData.category || "Other",
        highlights: initialData.highlights || [],
        inclusions: initialData.inclusions || [],
        exclusions: initialData.exclusions || [],
        itinerary: initialData.itinerary || [],
        price: initialData.price || { adult: 0, child: 0, infant: 0, currency: "INR" },
        discount: initialData.discount || { percentage: 0, validFrom: "", validUntil: "" },
        status: initialData.status || "active",
        destinations: initialData.destinations || [],
        customization: initialData.customization || {
          carRentals: { available: false, options: [] },
          guides: { available: false, options: [] },
          extendedStays: { available: false, pricePerDay: 0, description: "" },
          mealPlans: { available: false, options: [] }
        },
      })
      setImagePreviews(initialData.images || [])
      if (initialData.destinations && initialData.destinations.length > 0) {
        setSelectedDestinationIds(new Set(initialData.destinations.map((d: any) => {
          // Handle both destinationId and _id for backwards compatibility
          if (d.destinationId) return d.destinationId
          if (d._id) return d._id
          return ""
        }).filter(Boolean)))
      }
    }
  }, [initialData])

  useEffect(() => {
    fetchAllDestinations()
  }, [])

  const fetchAllDestinations = async () => {
    try {
      const response = await fetch(`${DESTINATION_API_BASE}/all`)
      const result = await response.json()
      if (result.status || result.success) {
        setAllDestinations(result.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch destinations:", error)
    }
  }

  const handleDestinationSelect = (dest: Destination) => {
    const destId = dest._id
    const newSelectedIds = new Set(selectedDestinationIds)

    if (newSelectedIds.has(destId)) {
      // Remove destination
      newSelectedIds.delete(destId)
      const updatedDestinations = formData.destinations.filter(d => d.destinationId !== destId)
      setFormData(prev => ({
        ...prev,
        destinations: updatedDestinations
      }))
    } else {
      // Add destination
      newSelectedIds.add(destId)
      const places: string[] = []
      
      // Extract places from placesDetails (for Season, Region, Adventure, Culture, Category)
      if (dest.placesDetails && dest.placesDetails.length > 0) {
        dest.placesDetails.forEach((placeDetail) => {
          if (placeDetail.placeName) {
            places.push(placeDetail.placeName)
          }
        })
      }
      
      // For Popular Destination (no placesDetails), use destination name as a place
      if (places.length === 0 && (dest.name || dest.title)) {
        places.push(dest.name || dest.title || "")
      }

      const newDest: SelectedDestination = {
        destinationId: destId,
        destinationName: dest.name || dest.title || "",
        destinationType: dest.type,
        budget: {
          accommodation: 0,
          food: 0,
          activities: 0,
          transport: 0,
          miscellaneous: 0,
          total: 0,
          currency: "INR"
        },
        places: places
      }

      setFormData(prev => ({
          ...prev,
        destinations: [...prev.destinations, newDest]
      }))
    }
    setSelectedDestinationIds(newSelectedIds)
  }

  const updateDestinationBudget = (destId: string, field: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      destinations: prev.destinations.map(d => {
        if (d.destinationId === destId) {
          const updatedBudget = { ...d.budget, [field]: value }
          // Calculate total
          updatedBudget.total = 
            updatedBudget.accommodation + 
            updatedBudget.food + 
            updatedBudget.activities + 
            updatedBudget.transport + 
            updatedBudget.miscellaneous
          return { ...d, budget: updatedBudget }
        }
        return d
      })
    }))
  }

  const removeDestination = (destId: string) => {
    setFormData(prev => ({
      ...prev,
      destinations: prev.destinations.filter(d => d.destinationId !== destId)
    }))
    const newSelectedIds = new Set(selectedDestinationIds)
    newSelectedIds.delete(destId)
    setSelectedDestinationIds(newSelectedIds)
  }

  const filteredDestinations = allDestinations.filter(dest => {
    // Filter by selected type if one is selected
    if (selectedDestinationType && dest.type !== selectedDestinationType) {
      return false
    }
    // Filter by search query
    const searchLower = destinationSearch.toLowerCase()
    const name = (dest.name || dest.title || "").toLowerCase()
    const type = dest.type.toLowerCase()
    const location = (dest.location || "").toLowerCase()
    return name.includes(searchLower) || type.includes(searchLower) || location.includes(searchLower)
  })

  const destinationTypes = [
    { type: "culture", label: "Cultural & Heritage", image: "/cultural.jpg", color: "from-purple-100 to-purple-200" },
    { type: "adventure", label: "Adventure Activities", image: "/manali-mountains.png", color: "from-blue-100 to-blue-200" },
    { type: "region", label: "Region", image: "/region.webp", color: "from-green-100 to-green-200" },
    { type: "popular", label: "Popular", image: "/goa-beach.jpg", color: "from-yellow-100 to-yellow-200" },
    { type: "season", label: "Season", image: "/camping.png", color: "from-orange-100 to-orange-200" },
    { type: "category", label: "Category", image: "/category.jpg", color: "from-pink-100 to-pink-200" },
  ]

  const getTypeCount = (type: string) => {
    return allDestinations.filter(d => d.type === type).length
  }

  const getDestinationTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      popular: "Popular",
      season: "Season",
      category: "Category",
      region: "Region",
      adventure: "Adventure",
      culture: "Culture"
    }
    return typeMap[type] || type
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setImageFiles(prev => [...prev, ...files])
      const newPreviews = files.map(file => URL.createObjectURL(file))
      setImagePreviews(prev => [...prev, ...newPreviews])
    }
  }

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const addHighlight = () => {
    if (highlightInput.trim()) {
      setFormData(prev => ({ ...prev, highlights: [...prev.highlights, highlightInput.trim()] }))
      setHighlightInput("")
    }
  }

  const removeHighlight = (index: number) => {
    setFormData(prev => ({ ...prev, highlights: prev.highlights.filter((_, i) => i !== index) }))
  }

  const addInclusion = () => {
    if (inclusionInput.trim()) {
      setFormData(prev => ({ ...prev, inclusions: [...prev.inclusions, inclusionInput.trim()] }))
      setInclusionInput("")
    }
  }

  const removeInclusion = (index: number) => {
    setFormData(prev => ({ ...prev, inclusions: prev.inclusions.filter((_, i) => i !== index) }))
  }

  const addExclusion = () => {
    if (exclusionInput.trim()) {
      setFormData(prev => ({ ...prev, exclusions: [...prev.exclusions, exclusionInput.trim()] }))
      setExclusionInput("")
    }
  }

  const removeExclusion = (index: number) => {
    setFormData(prev => ({ ...prev, exclusions: prev.exclusions.filter((_, i) => i !== index) }))
  }

  const addItineraryDay = () => {
    if (itineraryTitle.trim() && itineraryDescription.trim()) {
      const newItinerary = {
        day: itineraryDay,
        title: itineraryTitle.trim(),
        description: itineraryDescription.trim(),
        activities: itineraryActivities,
        meals: itineraryMeals || undefined,
        accommodation: itineraryAccommodation || undefined,
      }
      setFormData(prev => ({ ...prev, itinerary: [...prev.itinerary, newItinerary] }))
      setItineraryDay(prev => prev + 1)
      setItineraryTitle("")
      setItineraryDescription("")
      setItineraryActivities([])
      setItineraryActivityInput("")
      setItineraryMeals("")
      setItineraryAccommodation("")
      toast({
        title: "Success",
        description: "Itinerary day added successfully",
      })
    } else {
      toast({
        title: "Validation Error",
        description: "Please fill in title and description",
        variant: "destructive",
      })
    }
  }

  const removeItineraryDay = (index: number) => {
    setFormData(prev => ({
      ...prev,
      itinerary: prev.itinerary.filter((_, i) => i !== index).map((item, idx) => ({ ...item, day: idx + 1 }))
    }))
    setItineraryDay(prev => prev - 1)
  }

  const addItineraryActivity = () => {
    if (itineraryActivityInput.trim()) {
      setItineraryActivities(prev => [...prev, itineraryActivityInput.trim()])
      setItineraryActivityInput("")
    }
  }

  const removeItineraryActivity = (index: number) => {
    setItineraryActivities(prev => {
      const newActivities = prev.filter((_, i) => i !== index);
      return newActivities;
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isEdit) return // Prevent submission in view mode
    setIsSubmitting(true)

    try {
      const formDataToSend = new FormData()

      // Basic fields
      formDataToSend.append("title", formData.title)
      formDataToSend.append("duration", formData.duration)
      formDataToSend.append("source", formData.source)
      formDataToSend.append("destination", formData.destination)
      formDataToSend.append("overview", formData.overview)
      formDataToSend.append("otherDetails", formData.otherDetails || "")
      formDataToSend.append("category", formData.category)
      formDataToSend.append("highlights", JSON.stringify(formData.highlights))
      formDataToSend.append("inclusions", JSON.stringify(formData.inclusions))
      formDataToSend.append("exclusions", JSON.stringify(formData.exclusions))
      formDataToSend.append("itinerary", JSON.stringify(formData.itinerary))
      formDataToSend.append("price", JSON.stringify(formData.price))
      formDataToSend.append("discount", JSON.stringify(formData.discount))
      formDataToSend.append("status", formData.status)
      formDataToSend.append("destinations", JSON.stringify(formData.destinations))
      formDataToSend.append("customization", JSON.stringify(formData.customization))

      // Images
      imageFiles.forEach((file) => {
        formDataToSend.append("images", file)
      })

      // If edit and no new images, keep existing ones
      if (isEdit && imageFiles.length === 0 && imagePreviews.length > 0) {
        imagePreviews.forEach((url) => {
          formDataToSend.append("existingImages", url)
        })
      }

      const url = isEdit && initialData?._id
        ? `${PACKAGE_API_BASE}/UpdatePackage/${initialData._id}`
        : `${PACKAGE_API_BASE}/AddPackages`

      const method = isEdit && initialData?._id ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        body: formDataToSend,
      })

      const result = await response.json()

      if (result.status || result.success) {
        toast({
          title: "Success",
          description: isEdit ? "Package updated successfully" : "Package added successfully",
        })
        router.push("/admin/packages")
      } else {
        throw new Error(result.message || "Failed to save package")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save package",
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
          <Tabs defaultValue="destinations" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="destinations">Destinations</TabsTrigger>
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="customization">Customization</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Package Name *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Golden Triangle Tour, Himachal Adventure"
                    required
                    disabled={!isEdit}
                    readOnly={!isEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration *</Label>
                  <Input
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g., 5 Days 4 Nights"
                    required
                    disabled={!isEdit}
                    readOnly={!isEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source">Source City *</Label>
                  <Input
                    id="source"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    placeholder="e.g., Delhi, Mumbai"
                    required
                    disabled={!isEdit}
                    readOnly={!isEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination">Destination City *</Label>
                  <Input
                    id="destination"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    placeholder="e.g., Agra, Manali"
                    required
                    disabled={!isEdit}
                    readOnly={!isEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Package Category *</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                    disabled={!isEdit}
                  >
                    <option value="Adventure">Adventure</option>
                    <option value="Family">Family</option>
                    <option value="Honeymoon">Honeymoon</option>
                    <option value="Holiday">Holiday</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Religious">Religious</option>
                    <option value="Wildlife">Wildlife</option>
                    <option value="Beach">Beach</option>
                    <option value="Hill Station">Hill Station</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="overview">Overview *</Label>
                <Textarea
                  id="overview"
                  value={formData.overview}
                  onChange={(e) => setFormData({ ...formData, overview: e.target.value })}
                  placeholder="Package overview and description"
                  rows={6}
                  required
                  disabled={!isEdit}
                  readOnly={!isEdit}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adultPrice">Adult Price (₹) *</Label>
                  <Input
                    id="adultPrice"
                    type="number"
                    value={formData.price.adult === 0 ? "" : formData.price.adult}
                    onChange={(e) => setFormData({
                      ...formData,
                      price: { ...formData.price, adult: e.target.value === "" ? 0 : parseFloat(e.target.value) || 0 }
                    })}
                    placeholder="Enter adult price"
                    required
                    disabled={!isEdit}
                    readOnly={!isEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="childPrice">Child Price (₹)</Label>
                  <Input
                    id="childPrice"
                    type="number"
                    value={formData.price.child === 0 ? "" : formData.price.child}
                    onChange={(e) => setFormData({
                      ...formData,
                      price: { ...formData.price, child: e.target.value === "" ? 0 : parseFloat(e.target.value) || 0 }
                    })}
                    placeholder="Enter child price"
                    disabled={!isEdit}
                    readOnly={!isEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalBudget">Total Budget (₹)</Label>
                  <Input
                    id="totalBudget"
                    type="number"
                    value={formData.destinations.reduce((total: number, dest: any) => {
                      return total + (dest.budget?.total || 0);
                    }, 0) || ""}
                    readOnly
                    className="bg-muted"
                    placeholder="Calculated from destinations"
                  />
                  <p className="text-xs text-muted-foreground">Sum of all destination budgets</p>
                </div>
              </div>

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

            {/* Destinations Tab */}
            <TabsContent value="destinations" className="space-y-4 mt-4">
              <div className="space-y-4">
                {/* View Mode - Show selected destinations in explore destination style */}
                {!isEdit && formData.destinations.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Selected Destinations</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {formData.destinations.map((selectedDest) => {
                        const fullDest = allDestinations.find(d => d._id === selectedDest.destinationId)
                        return (
                          <Card key={selectedDest.destinationId} className="overflow-hidden">
                            <div className="relative h-48 w-full overflow-hidden">
                              {(fullDest?.image || (fullDest?.images && fullDest.images.length > 0)) ? (
                                <img
                                  src={fullDest.image || (fullDest.images && fullDest.images[0])}
                                  alt={selectedDest.destinationName}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                                  <MapPin className="h-12 w-12 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <CardContent className="p-4">
                              <div className="space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="font-semibold text-base line-clamp-1">
                                    {selectedDest.destinationName}
                                  </h4>
                                  <Badge variant="outline" className="shrink-0">
                                    {getDestinationTypeLabel(selectedDest.destinationType)}
                                  </Badge>
                                </div>
                                {fullDest?.location && (
                                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {fullDest.location}
                                  </p>
                                )}
                                {selectedDest.places && selectedDest.places.length > 0 && (
                                  <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground">Places to Visit:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {selectedDest.places.slice(0, 3).map((place, idx) => (
                                        <Badge key={idx} variant="secondary" className="text-xs">
                                          {place}
                                        </Badge>
                                      ))}
                                      {selectedDest.places.length > 3 && (
                                        <Badge variant="secondary" className="text-xs">
                                          +{selectedDest.places.length - 3} more
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                )}
                                {selectedDest.budget?.total > 0 && (
                                  <div className="pt-2 border-t">
                                    <p className="text-xs text-muted-foreground">Total Budget</p>
                                    <p className="text-sm font-semibold">₹{selectedDest.budget.total.toLocaleString()}</p>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                ) : !selectedDestinationType ? (
                  // Show type selection only if no destinations exist in edit mode
                  isEdit && formData.destinations.length > 0 ? null : (
                    <>
                      {/* Destination Type Selection */}
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Select Destination Type</h3>
                        <p className="text-sm text-muted-foreground mb-4">Choose a destination type to view available destinations</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {destinationTypes.map((typeInfo) => {
                          const count = getTypeCount(typeInfo.type)
                          return (
                            <Card
                              key={typeInfo.type}
                              className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 overflow-hidden !p-0"
                              onClick={() => setSelectedDestinationType(typeInfo.type)}
                            >
                              <div className="relative h-32 w-full overflow-hidden m-0">
                                <img
                                  src={typeInfo.image}
                                  alt={typeInfo.label}
                                  className="h-full w-full object-cover object-center"
                                />
                              </div>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-semibold text-lg">{typeInfo.label}</h4>
                                  <Badge variant="secondary">{count} destinations</Badge>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    </>
                  )
                ) : (
                  <>
                    {/* Destination List for Selected Type */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedDestinationType(null)
                            setDestinationSearch("")
                          }}
                        >
                          ← Back to Types
                        </Button>
                        <div>
                          <h3 className="text-lg font-semibold">
                            {destinationTypes.find(t => t.type === selectedDestinationType)?.label || "Destinations"}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {filteredDestinations.length} destination{filteredDestinations.length !== 1 ? 's' : ''} available
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Search Bar */}
                    <Card className="p-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search destinations by name or location..."
                          value={destinationSearch}
                          onChange={(e) => setDestinationSearch(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </Card>

                    {/* Destination Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredDestinations.map((dest) => {
                        const isSelected = selectedDestinationIds.has(dest._id)
                        const destImage = dest.images?.[0] || dest.image
                        return (
                          <Card
                            key={dest._id}
                            className={`cursor-pointer transition-all hover:shadow-lg overflow-hidden !p-0 ${
                              isSelected ? "ring-2 ring-primary border-primary" : ""
                            }`}
                            onClick={() => handleDestinationSelect(dest)}
                          >
                            <div className="relative m-0">
                              {destImage ? (
                                <img
                                  src={destImage}
                                  alt={dest.name || dest.title}
                                  className="h-40 w-full object-cover object-center"
                                />
                              ) : (
                                <div className="h-40 w-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                                  <MapPin className="h-12 w-12 text-muted-foreground" />
                                </div>
                              )}
                              {isSelected && (
                                <div className="absolute top-2 right-2">
                                  <div className="bg-primary text-primary-foreground rounded-full p-1.5">
                                    <CheckCircle2 className="h-5 w-5" />
                                  </div>
                                </div>
                              )}
                            </div>
                            <CardContent className="p-4">
                              <div className="space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="font-semibold text-base line-clamp-1">
                                    {dest.name || dest.title}
                                  </h4>
                                  <Badge variant="outline" className="shrink-0">
                                    {getDestinationTypeLabel(dest.type)}
                                  </Badge>
                                </div>
                                {dest.location && (
                                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {dest.location}
                                  </p>
                                )}
                                {(dest.description || dest.desc) && (
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {dest.description || dest.desc}
                                  </p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>

                    {filteredDestinations.length === 0 && (
                      <Card>
                        <CardContent className="py-12 text-center">
                          <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-sm text-muted-foreground">No destinations found</p>
                          <p className="text-xs text-muted-foreground mt-2">Try adjusting your search terms</p>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}

                {/* Selected Destinations with Budget - Show when a destination type is selected OR in edit mode with existing destinations */}
                {(selectedDestinationType || (isEdit && formData.destinations.length > 0 && !selectedDestinationType)) && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Selected Destinations & Budget</h3>
                        {isEdit && !selectedDestinationType && formData.destinations.length > 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Show type selection to add more destinations
                              // We'll need to handle this differently - maybe use a state to force show type selection
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add More Destinations
                          </Button>
                        )}
                      </div>
                      
                      {formData.destinations.filter(dest => 
                        !selectedDestinationType || dest.destinationType === selectedDestinationType
                      ).length === 0 ? (
                        <Card>
                          <CardContent className="py-8 text-center text-muted-foreground">
                            {isEdit && !selectedDestinationType 
                              ? "No destinations selected. Select a destination type above to add destinations."
                              : `No destinations selected for ${destinationTypes.find(t => t.type === selectedDestinationType)?.label || "this type"}. Select destinations from above to add them.`
                            }
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="space-y-4">
                          {formData.destinations
                            .filter(dest => !selectedDestinationType || dest.destinationType === selectedDestinationType)
                            .map((selectedDest, index) => {
                            const fullDest = allDestinations.find(d => d._id === selectedDest.destinationId)
                            return (
                          <Card key={selectedDest.destinationId}>
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-5 w-5" />
                                  <CardTitle className="text-lg">{selectedDest.destinationName}</CardTitle>
                                  <Badge variant="outline">{getDestinationTypeLabel(selectedDest.destinationType)}</Badge>
                                </div>
                                {isEdit && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeDestination(selectedDest.destinationId)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {/* Destination Image */}
                              {(fullDest?.image || (fullDest?.images && fullDest.images.length > 0)) ? (
                                <div className="relative h-48 w-full overflow-hidden rounded-lg">
                                  <img
                                    src={fullDest.image || (fullDest.images && fullDest.images[0])}
                                    alt={selectedDest.destinationName}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="relative h-48 w-full overflow-hidden rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                                  <MapPin className="h-12 w-12 text-muted-foreground" />
                                </div>
                              )}

                              {/* Places where users can visit */}
                              {selectedDest.places && selectedDest.places.length > 0 && (
                                <div className="space-y-2">
                                  <Label>Yahan Ghoom Sakte Hain:</Label>
                                  <div className="flex flex-wrap gap-2">
                                    {selectedDest.places.map((place, placeIndex) => (
                                      <Badge key={placeIndex} variant="secondary">
                                        <MapPin className="h-3 w-3 mr-1" />
                                        {place}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <Separator />

                              {/* Budget Information */}
                              <div className="space-y-3">
                                <Label className="text-base font-semibold">Budget Information (₹)</Label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="space-y-2">
                                    <Label>Accommodation</Label>
                                    <Input
                                      type="number"
                                      value={selectedDest.budget.accommodation === 0 ? "" : selectedDest.budget.accommodation || ""}
                                      onChange={(e) => updateDestinationBudget(
                                        selectedDest.destinationId,
                                        "accommodation",
                                        e.target.value === "" ? 0 : parseFloat(e.target.value) || 0
                                      )}
                                      placeholder="Enter amount"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Food</Label>
                                    <Input
                                      type="number"
                                      value={selectedDest.budget.food === 0 ? "" : selectedDest.budget.food || ""}
                                      onChange={(e) => updateDestinationBudget(
                                        selectedDest.destinationId,
                                        "food",
                                        e.target.value === "" ? 0 : parseFloat(e.target.value) || 0
                                      )}
                                      placeholder="Enter amount"
                                      disabled={!isEdit}
                                      readOnly={!isEdit}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Activities</Label>
                                    <Input
                                      type="number"
                                      value={selectedDest.budget.activities === 0 ? "" : selectedDest.budget.activities || ""}
                                      onChange={(e) => updateDestinationBudget(
                                        selectedDest.destinationId,
                                        "activities",
                                        e.target.value === "" ? 0 : parseFloat(e.target.value) || 0
                                      )}
                                      placeholder="Enter amount"
                                      disabled={!isEdit}
                                      readOnly={!isEdit}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Transport</Label>
                                    <Input
                                      type="number"
                                      value={selectedDest.budget.transport === 0 ? "" : selectedDest.budget.transport || ""}
                                      onChange={(e) => updateDestinationBudget(
                                        selectedDest.destinationId,
                                        "transport",
                                        e.target.value === "" ? 0 : parseFloat(e.target.value) || 0
                                      )}
                                      placeholder="Enter amount"
                                      disabled={!isEdit}
                                      readOnly={!isEdit}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Miscellaneous</Label>
                                    <Input
                                      type="number"
                                      value={selectedDest.budget.miscellaneous === 0 ? "" : selectedDest.budget.miscellaneous || ""}
                                      onChange={(e) => updateDestinationBudget(
                                        selectedDest.destinationId,
                                        "miscellaneous",
                                        e.target.value === "" ? 0 : parseFloat(e.target.value) || 0
                                      )}
                                      placeholder="Enter amount"
                                      disabled={!isEdit}
                                      readOnly={!isEdit}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="font-semibold">Total Budget</Label>
                                    <Input
                                      type="number"
                                      value={selectedDest.budget.total || 0}
                                      readOnly
                                      className="font-semibold bg-muted"
                                    />
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            {/* Itinerary Tab */}
            <TabsContent value="itinerary" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Package Itinerary</h3>
                  {isEdit && (
                  <Button type="button" onClick={addItineraryDay} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Day
                  </Button>
                  )}
                </div>

                {isEdit && (
                <Card className="p-4 bg-muted/30">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Day Number</Label>
                        <Input
                          type="number"
                          value={itineraryDay}
                          onChange={(e) => setItineraryDay(parseInt(e.target.value) || 1)}
                          min={1}
                            disabled={!isEdit}
                            readOnly={!isEdit}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Day Title *</Label>
                        <Input
                          value={itineraryTitle}
                          onChange={(e) => setItineraryTitle(e.target.value)}
                          placeholder="e.g., Arrival in Delhi"
                            disabled={!isEdit}
                            readOnly={!isEdit}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description *</Label>
                      <Textarea
                        value={itineraryDescription}
                        onChange={(e) => setItineraryDescription(e.target.value)}
                        placeholder="Day description"
                        rows={4}
                          disabled={!isEdit}
                          readOnly={!isEdit}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Meals</Label>
                        <Input
                          value={itineraryMeals}
                          onChange={(e) => setItineraryMeals(e.target.value)}
                          placeholder="e.g., Breakfast, Dinner"
                            disabled={!isEdit}
                            readOnly={!isEdit}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Accommodation</Label>
                        <Input
                          value={itineraryAccommodation}
                          onChange={(e) => setItineraryAccommodation(e.target.value)}
                          placeholder="e.g., Hotel Name"
                            disabled={!isEdit}
                            readOnly={!isEdit}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Activities</Label>
                      <div className="flex gap-2">
                        <Input
                          value={itineraryActivityInput}
                          onChange={(e) => setItineraryActivityInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              addItineraryActivity()
                            }
                          }}
                          placeholder="Enter activity and press Enter"
                        />
                        <Button type="button" onClick={addItineraryActivity} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {itineraryActivities.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {itineraryActivities.map((activity, idx) => (
                              <div
                                key={`activity-${idx}-${activity}`}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-secondary text-secondary-foreground"
                              >
                                <span>{activity}</span>
                                <button
                                  type="button"
                                  className="ml-1 hover:text-destructive focus:outline-none cursor-pointer"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    removeItineraryActivity(idx);
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
                )}

                <Separator />

                {/* Itinerary List */}
                <div className="space-y-2">
                  {formData.itinerary.map((day, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge>Day {day.day}</Badge>
                              <h4 className="font-semibold">{day.title}</h4>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{day.description}</p>
                            {day.activities && day.activities.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {day.activities.map((activity, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {activity}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <div className="flex gap-4 text-sm text-muted-foreground">
                              {day.meals && <span>🍽️ Meals: {day.meals}</span>}
                              {day.accommodation && <span>🏨 Stay: {day.accommodation}</span>}
                            </div>
                          </div>
                          {isEdit && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItineraryDay(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {formData.itinerary.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No itinerary added yet</p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="space-y-6">
                {/* Highlights */}
                <div className="space-y-2">
                  <Label>Highlights</Label>
                  {isEdit && (
                  <div className="flex gap-2">
                    <Input
                      value={highlightInput}
                      onChange={(e) => setHighlightInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addHighlight()
                        }
                      }}
                      placeholder="Enter highlight and press Enter"
                    />
                    <Button type="button" onClick={addHighlight} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.highlights.map((highlight, index) => (
                      <div
                        key={`highlight-${index}-${highlight}`}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-secondary text-secondary-foreground"
                      >
                        <span>{highlight}</span>
                        {isEdit && (
                          <button
                            type="button"
                            className="ml-1 hover:text-destructive focus:outline-none cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              removeHighlight(index);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Inclusions */}
                <div className="space-y-2">
                  <Label>Inclusions</Label>
                  {isEdit && (
                  <div className="flex gap-2">
                    <Input
                      value={inclusionInput}
                      onChange={(e) => setInclusionInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addInclusion()
                        }
                      }}
                      placeholder="Enter inclusion and press Enter"
                    />
                    <Button type="button" onClick={addInclusion} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.inclusions.map((inclusion, index) => (
                      <div
                        key={`inclusion-${index}-${inclusion}`}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-secondary text-secondary-foreground"
                      >
                        <span>{inclusion}</span>
                        {isEdit && (
                          <button
                            type="button"
                            className="ml-1 hover:text-destructive focus:outline-none cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              removeInclusion(index);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Exclusions */}
                <div className="space-y-2">
                  <Label>Exclusions</Label>
                  {isEdit && (
                  <div className="flex gap-2">
                    <Input
                      value={exclusionInput}
                      onChange={(e) => setExclusionInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addExclusion()
                        }
                      }}
                      placeholder="Enter exclusion and press Enter"
                    />
                    <Button type="button" onClick={addExclusion} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.exclusions.map((exclusion, index) => (
                      <div
                        key={`exclusion-${index}-${exclusion}`}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-secondary text-secondary-foreground"
                      >
                        <span>{exclusion}</span>
                        {isEdit && (
                          <button
                            type="button"
                            className="ml-1 hover:text-destructive focus:outline-none cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              removeExclusion(index);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Other Details */}
                <div className="space-y-2">
                  <Label>Other Details</Label>
                  <Textarea
                    value={formData.otherDetails}
                    onChange={(e) => setFormData({ ...formData, otherDetails: e.target.value })}
                    placeholder="Additional details, terms & conditions, etc."
                    rows={6}
                    disabled={!isEdit}
                    readOnly={!isEdit}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Customization Tab */}
            <TabsContent value="customization" className="space-y-4 mt-4">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Customization Options</h3>
                
                {/* Car Rentals */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Car Rentals</CardTitle>
                      <input
                        type="checkbox"
                        checked={formData.customization.carRentals.available}
                        onChange={(e) => setFormData({
                          ...formData,
                          customization: {
                            ...formData.customization,
                            carRentals: { ...formData.customization.carRentals, available: e.target.checked }
                          }
                        })}
                        className="w-4 h-4"
                        disabled={!isEdit}
                      />
                    </div>
                  </CardHeader>
                  {formData.customization.carRentals.available && (
                    <CardContent className="space-y-4">
                      {isEdit && (
                      <Button
                        type="button"
                        onClick={() => setFormData({
                          ...formData,
                          customization: {
                            ...formData.customization,
                            carRentals: {
                              ...formData.customization.carRentals,
                              options: [...formData.customization.carRentals.options, { carType: "", pricePerDay: 0, description: "" }]
                            }
                          }
                        })}
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Car Option
                      </Button>
                      )}
                      {formData.customization.carRentals.options.map((option, index) => (
                        <div key={index} className="p-4 border rounded-lg space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              placeholder="Car Type (e.g., Sedan, SUV)"
                              value={option.carType}
                              onChange={(e) => {
                                const newOptions = [...formData.customization.carRentals.options]
                                newOptions[index].carType = e.target.value
                                setFormData({
                                  ...formData,
                                  customization: {
                                    ...formData.customization,
                                    carRentals: { ...formData.customization.carRentals, options: newOptions }
                                  }
                                })
                              }}
                              disabled={!isEdit}
                              readOnly={!isEdit}
                            />
                            <Input
                              type="number"
                              placeholder="Price per day"
                              value={option.pricePerDay}
                              onChange={(e) => {
                                const newOptions = [...formData.customization.carRentals.options]
                                newOptions[index].pricePerDay = parseFloat(e.target.value) || 0
                                setFormData({
                                  ...formData,
                                  customization: {
                                    ...formData.customization,
                                    carRentals: { ...formData.customization.carRentals, options: newOptions }
                                  }
                                })
                              }}
                              disabled={!isEdit}
                              readOnly={!isEdit}
                            />
                          </div>
                          <Textarea
                            placeholder="Description"
                            value={option.description}
                            onChange={(e) => {
                              const newOptions = [...formData.customization.carRentals.options]
                              newOptions[index].description = e.target.value
                              setFormData({
                                ...formData,
                                customization: {
                                  ...formData.customization,
                                  carRentals: { ...formData.customization.carRentals, options: newOptions }
                                }
                              })
                            }}
                            rows={2}
                            disabled={!isEdit}
                            readOnly={!isEdit}
                          />
                          {isEdit && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              const newOptions = formData.customization.carRentals.options.filter((_, i) => i !== index)
                              setFormData({
                                ...formData,
                                customization: {
                                  ...formData.customization,
                                  carRentals: { ...formData.customization.carRentals, options: newOptions }
                                }
                              })
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  )}
                </Card>

                {/* Guides */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Guides</CardTitle>
                      <input
                        type="checkbox"
                        checked={formData.customization.guides.available}
                        onChange={(e) => setFormData({
                          ...formData,
                          customization: {
                            ...formData.customization,
                            guides: { ...formData.customization.guides, available: e.target.checked }
                          }
                        })}
                        className="w-4 h-4"
                        disabled={!isEdit}
                      />
                    </div>
                  </CardHeader>
                  {formData.customization.guides.available && (
                    <CardContent className="space-y-4">
                      {isEdit && (
                      <Button
                        type="button"
                        onClick={() => setFormData({
                          ...formData,
                          customization: {
                            ...formData.customization,
                            guides: {
                              ...formData.customization.guides,
                              options: [...formData.customization.guides.options, { guideType: "", price: 0, description: "" }]
                            }
                          }
                        })}
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Guide Option
                      </Button>
                      )}
                      {formData.customization.guides.options.map((option, index) => (
                        <div key={index} className="p-4 border rounded-lg space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              placeholder="Guide Type (e.g., Local Guide, Expert Guide)"
                              value={option.guideType}
                              onChange={(e) => {
                                const newOptions = [...formData.customization.guides.options]
                                newOptions[index].guideType = e.target.value
                                setFormData({
                                  ...formData,
                                  customization: {
                                    ...formData.customization,
                                    guides: { ...formData.customization.guides, options: newOptions }
                                  }
                                })
                              }}
                              disabled={!isEdit}
                              readOnly={!isEdit}
                            />
                            <Input
                              type="number"
                              placeholder="Price"
                              value={option.price}
                              onChange={(e) => {
                                const newOptions = [...formData.customization.guides.options]
                                newOptions[index].price = parseFloat(e.target.value) || 0
                                setFormData({
                                  ...formData,
                                  customization: {
                                    ...formData.customization,
                                    guides: { ...formData.customization.guides, options: newOptions }
                                  }
                                })
                              }}
                              disabled={!isEdit}
                              readOnly={!isEdit}
                            />
                          </div>
                          <Textarea
                            placeholder="Description"
                            value={option.description}
                            onChange={(e) => {
                              const newOptions = [...formData.customization.guides.options]
                              newOptions[index].description = e.target.value
                              setFormData({
                                ...formData,
                                customization: {
                                  ...formData.customization,
                                  guides: { ...formData.customization.guides, options: newOptions }
                                }
                              })
                            }}
                            rows={2}
                            disabled={!isEdit}
                            readOnly={!isEdit}
                          />
                          {isEdit && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              const newOptions = formData.customization.guides.options.filter((_, i) => i !== index)
                              setFormData({
                                ...formData,
                                customization: {
                                  ...formData.customization,
                                  guides: { ...formData.customization.guides, options: newOptions }
                                }
                              })
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  )}
                </Card>

                {/* Extended Stays */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Extended Stays</CardTitle>
                      <input
                        type="checkbox"
                        checked={formData.customization.extendedStays.available}
                        onChange={(e) => setFormData({
                          ...formData,
                          customization: {
                            ...formData.customization,
                            extendedStays: { ...formData.customization.extendedStays, available: e.target.checked }
                          }
                        })}
                        className="w-4 h-4"
                        disabled={!isEdit}
                      />
                    </div>
                  </CardHeader>
                  {formData.customization.extendedStays.available && (
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Price Per Day (₹)</Label>
                          <Input
                            type="number"
                            value={formData.customization.extendedStays.pricePerDay}
                            onChange={(e) => setFormData({
                              ...formData,
                              customization: {
                                ...formData.customization,
                                extendedStays: {
                                  ...formData.customization.extendedStays,
                                  pricePerDay: parseFloat(e.target.value) || 0
                                }
                              }
                            })}
                            disabled={!isEdit}
                            readOnly={!isEdit}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={formData.customization.extendedStays.description}
                          onChange={(e) => setFormData({
                            ...formData,
                            customization: {
                              ...formData.customization,
                              extendedStays: {
                                ...formData.customization.extendedStays,
                                description: e.target.value
                              }
                            }
                          })}
                          rows={3}
                          placeholder="Describe extended stay options"
                          disabled={!isEdit}
                          readOnly={!isEdit}
                        />
                      </div>
                    </CardContent>
                  )}
                </Card>

                {/* Meal Plans */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Meal Plans</CardTitle>
                      <input
                        type="checkbox"
                        checked={formData.customization.mealPlans.available}
                        onChange={(e) => setFormData({
                          ...formData,
                          customization: {
                            ...formData.customization,
                            mealPlans: { ...formData.customization.mealPlans, available: e.target.checked }
                          }
                        })}
                        className="w-4 h-4"
                        disabled={!isEdit}
                      />
                    </div>
                  </CardHeader>
                  {formData.customization.mealPlans.available && (
                    <CardContent className="space-y-4">
                      {isEdit && (
                      <Button
                        type="button"
                        onClick={() => setFormData({
                          ...formData,
                          customization: {
                            ...formData.customization,
                            mealPlans: {
                              ...formData.customization.mealPlans,
                              options: [...formData.customization.mealPlans.options, { planType: "", price: 0, description: "" }]
                            }
                          }
                        })}
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Meal Plan
                      </Button>
                      )}
                      {formData.customization.mealPlans.options.map((option, index) => (
                        <div key={index} className="p-4 border rounded-lg space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              placeholder="Plan Type (e.g., Breakfast Only, Half Board)"
                              value={option.planType}
                              onChange={(e) => {
                                const newOptions = [...formData.customization.mealPlans.options]
                                newOptions[index].planType = e.target.value
                                setFormData({
                                  ...formData,
                                  customization: {
                                    ...formData.customization,
                                    mealPlans: { ...formData.customization.mealPlans, options: newOptions }
                                  }
                                })
                              }}
                              disabled={!isEdit}
                              readOnly={!isEdit}
                            />
                            <Input
                              type="number"
                              placeholder="Price"
                              value={option.price}
                              onChange={(e) => {
                                const newOptions = [...formData.customization.mealPlans.options]
                                newOptions[index].price = parseFloat(e.target.value) || 0
                                setFormData({
                                  ...formData,
                                  customization: {
                                    ...formData.customization,
                                    mealPlans: { ...formData.customization.mealPlans, options: newOptions }
                                  }
                                })
                              }}
                              disabled={!isEdit}
                              readOnly={!isEdit}
                            />
                          </div>
                          <Textarea
                            placeholder="Description"
                            value={option.description}
                            onChange={(e) => {
                              const newOptions = [...formData.customization.mealPlans.options]
                              newOptions[index].description = e.target.value
                              setFormData({
                                ...formData,
                                customization: {
                                  ...formData.customization,
                                  mealPlans: { ...formData.customization.mealPlans, options: newOptions }
                                }
                              })
                            }}
                            rows={2}
                            disabled={!isEdit}
                            readOnly={!isEdit}
                          />
                          {isEdit && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              const newOptions = formData.customization.mealPlans.options.filter((_, i) => i !== index)
                              setFormData({
                                ...formData,
                                customization: {
                                  ...formData.customization,
                                  mealPlans: { ...formData.customization.mealPlans, options: newOptions }
                                }
                              })
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  )}
                </Card>
              </div>
            </TabsContent>

            {/* Images Tab */}
            <TabsContent value="images" className="space-y-4 mt-4">
              {isEdit && (
              <div className="space-y-2">
                <Label>Package Images</Label>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                />
              </div>
              )}

              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="h-32 w-full rounded object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              {isEdit && (
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
                  {isEdit ? "Update Package" : "Add Package"}
                </>
              )}
            </Button>
          </div>
              )}
            </TabsContent>
          </Tabs>
        </form>
      </CardContent>
    </Card>
  )
}

