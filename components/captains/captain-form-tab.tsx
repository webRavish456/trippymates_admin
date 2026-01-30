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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CaptainAvailabilityTab } from "./captain-availability-tab"
import { CaptainPaymentTab } from "./captain-payment-tab"
import { API_BASE_URL } from "@/lib/config"
import { EditPageSkeleton } from "@/components/ui/skeletons"

const API_BASE = `${API_BASE_URL}/api/admin/captain`

export function CaptainFormTab() {
  const router = useRouter()
  const params = useParams()
  const captainId = params?.id as string
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(!!(captainId && captainId !== "new"))

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    experience: "" as string | number,
    specialization: [] as string[],
    category: [] as string[],
    languages: [] as string[],
    rating: "" as string | number,
    bio: "",
    status: "active" as "active" | "inactive" | "on-leave",
    price: "" as string | number,
    badge: "Local Expert",
    bankDetails: {
      accountHolderName: "",
      accountNumber: "",
      ifscCode: "",
      bankName: "",
      branchName: "",
      accountType: "savings" as "savings" | "current",
      upiId: ""
    }
  })
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([])
  const [selectedDocuments, setSelectedDocuments] = useState<File[]>([])
  const [selectedProfileImage, setSelectedProfileImage] = useState<File | null>(null)
  const [selectedBackgroundImage, setSelectedBackgroundImage] = useState<File | null>(null)
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [documentPreviews, setDocumentPreviews] = useState<string[]>([])
  const [profileImagePreview, setProfileImagePreview] = useState<string>("")
  const [backgroundImagePreview, setBackgroundImagePreview] = useState<string>("")
  const [selectedMainSpecializations, setSelectedMainSpecializations] = useState<string[]>([])

  const specializationOptions: Record<string, string[]> = {
    "Adventure": ["Trekking", "Camping", "Rock Climbing", "Paragliding", "Rafting", "Bungee Jumping"],
    "Cultural": ["Heritage Tours", "Temple Visits", "Local Festivals", "Art & Craft Tours", "Historical Sites"],
    "Wildlife": ["Safari", "Bird Watching", "Jungle Trekking", "Wildlife Photography"],
    "Beach": ["Water Sports", "Scuba Diving", "Snorkeling", "Beach Volleyball", "Surfing"],
    "Hill Station": ["Mountain Climbing", "Skiing", "Nature Walks", "Valley Tours"],
    "Religious": ["Pilgrimage", "Temple Tours", "Spiritual Retreats"],
    "Family": ["Kid-friendly Tours", "Group Tours", "Educational Tours"],
    "Honeymoon": ["Romantic Getaways", "Couple Activities", "Private Tours"]
  }
  const languageOptions = ["English", "Hindi"]
  const categoryOptions = ["Solo Traveler", "Family", "Couple", "Group", "Business"]

  useEffect(() => {
    if (captainId && captainId !== 'new') {
      fetchCaptain(captainId)
    }
  }, [captainId])

  const fetchCaptain = async (id: string) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${API_BASE}/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      
      if (data.status && data.data) {
        const captain = data.data
        // Parse specialization to extract main categories
        const existingSpecializations = captain.specialization || []
        const mainSpecs: string[] = []
        existingSpecializations.forEach((spec: string) => {
          // Check if it's a main category
          const mainCategories = Object.keys(specializationOptions)
          if (mainCategories.includes(spec)) {
            mainSpecs.push(spec)
          } else {
            // Extract main category from sub-category format "Main - Sub"
            const parts = spec.split(' - ')
            if (parts.length > 0 && mainCategories.includes(parts[0]) && !mainSpecs.includes(parts[0])) {
              mainSpecs.push(parts[0])
            }
          }
        })
        setSelectedMainSpecializations(mainSpecs)

        setFormData({
          name: captain.name || "",
          email: captain.email || "",
          phone: captain.phone || "",
          address: captain.address || "",
          experience: captain.experience !== undefined && captain.experience !== null ? captain.experience.toString() : "",
          specialization: existingSpecializations,
          category: captain.category || [],
          languages: captain.languages || [],
          rating: captain.rating !== undefined && captain.rating !== null ? captain.rating.toString() : "",
          bio: captain.bio || "",
          status: captain.status || "active",
          price: captain.price !== undefined && captain.price !== null ? captain.price.toString() : "",
          badge: captain.badge || "Local Expert",
          bankDetails: {
            accountHolderName: captain.bankDetails?.accountHolderName || "",
            accountNumber: captain.bankDetails?.accountNumber || "",
            ifscCode: captain.bankDetails?.ifscCode || "",
            bankName: captain.bankDetails?.bankName || "",
            branchName: captain.bankDetails?.branchName || "",
            accountType: captain.bankDetails?.accountType || "savings",
            upiId: captain.bankDetails?.upiId || ""
          }
        })
        if (captain.photos && Array.isArray(captain.photos)) {
          setPhotoPreviews(captain.photos)
        }
        if (captain.documents && Array.isArray(captain.documents)) {
          setDocumentPreviews(captain.documents)
        }
        if (captain.profileImage) {
          setProfileImagePreview(captain.profileImage)
        }
        if (captain.backgroundImage) {
          setBackgroundImagePreview(captain.backgroundImage)
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch captain",
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
      const url = captainId && captainId !== 'new' ? `${API_BASE}/update/${captainId}` : `${API_BASE}/add`
      const method = captainId && captainId !== 'new' ? 'PUT' : 'POST'

      let response: Response

      // If files are selected, use FormData, otherwise use JSON
      if (selectedPhotos.length > 0 || selectedDocuments.length > 0 || selectedProfileImage || selectedBackgroundImage) {
        const formDataToSend = new FormData()
        formDataToSend.append('name', formData.name)
        formDataToSend.append('email', formData.email)
        formDataToSend.append('phone', formData.phone)
        formDataToSend.append('address', formData.address || '')
        if (formData.experience !== "" && formData.experience !== null && formData.experience !== undefined) {
          formDataToSend.append('experience', formData.experience.toString())
        }
        if (formData.rating !== "" && formData.rating !== null && formData.rating !== undefined) {
          formDataToSend.append('rating', formData.rating.toString())
        }
        if (formData.price !== "" && formData.price !== null && formData.price !== undefined) {
          formDataToSend.append('price', formData.price.toString())
        }
        formDataToSend.append('badge', formData.badge || 'Local Expert')
        formDataToSend.append('specialization', JSON.stringify(formData.specialization))
        formDataToSend.append('category', JSON.stringify(formData.category))
        formDataToSend.append('languages', JSON.stringify(formData.languages))
        formDataToSend.append('bio', formData.bio || '')
        formDataToSend.append('status', formData.status)
        formDataToSend.append('bankDetails', JSON.stringify(formData.bankDetails))
        
        selectedPhotos.forEach((photo) => {
          formDataToSend.append('photos', photo)
        })
        selectedDocuments.forEach((doc) => {
          formDataToSend.append('documents', doc)
        })
        if (selectedProfileImage) {
          formDataToSend.append('profileImage', selectedProfileImage)
        }
        if (selectedBackgroundImage) {
          formDataToSend.append('backgroundImage', selectedBackgroundImage)
        }

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
          experience: formData.experience === "" || formData.experience === null || formData.experience === undefined ? null : (typeof formData.experience === 'string' ? (formData.experience.trim() === "" ? null : parseInt(formData.experience)) : formData.experience),
          rating: formData.rating === "" || formData.rating === null || formData.rating === undefined ? null : (typeof formData.rating === 'string' ? (formData.rating.trim() === "" ? null : parseFloat(formData.rating)) : formData.rating),
          bankDetails: formData.bankDetails
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
          description: captainId && captainId !== 'new' ? "Captain updated successfully" : "Captain created successfully",
        })
        setSelectedPhotos([])
        setSelectedDocuments([])
        router.push('/admin/captain/details')
      } else {
        throw new Error(data.message || "Failed to save captain")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save captain",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleMainSpecialization = (mainSpec: string) => {
    if (selectedMainSpecializations.includes(mainSpec)) {
      // Remove main spec and all its sub-specs
      setSelectedMainSpecializations(selectedMainSpecializations.filter(s => s !== mainSpec))
      setFormData({
        ...formData,
        specialization: formData.specialization.filter(s => {
          // Remove main spec itself
          if (s === mainSpec) return false
          // Remove sub-specs that start with mainSpec
          if (s.startsWith(`${mainSpec} - `)) return false
          return true
        })
      })
    } else {
      // Add main spec
      setSelectedMainSpecializations([...selectedMainSpecializations, mainSpec])
    }
  }

  const toggleSubSpecialization = (mainSpec: string, subSpec: string) => {
    const fullSubSpec = `${mainSpec} - ${subSpec}`
    setFormData({
      ...formData,
      specialization: formData.specialization.includes(fullSubSpec)
        ? formData.specialization.filter(s => s !== fullSubSpec)
        : [...formData.specialization, fullSubSpec]
    })
  }

  const toggleLanguage = (lang: string) => {
    setFormData({
      ...formData,
      languages: formData.languages.includes(lang)
        ? formData.languages.filter(l => l !== lang)
        : [...formData.languages, lang]
    })
  }

  const isNewCaptain = !captainId || captainId === 'new'

  if (loading) {
    return <EditPageSkeleton />
  }

  return (
    <div className="space-y-4 pb-0">
      <div>
        <h2 className="text-2xl font-bold">{isNewCaptain ? 'Create New Captain' : 'Edit Captain'}</h2>
        <p className="text-sm text-muted-foreground">Manage captain information</p>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pb-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Captain name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="captain@example.com"
                  required
                  disabled={!!captainId && captainId !== 'new'}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1234567890"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Address"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="experience">Experience (Years)</Label>
                <Input
                  id="experience"
                  type="number"
                  value={formData.experience}
                  onChange={(e) => {
                    const value = e.target.value
                    setFormData({ ...formData, experience: value === "" ? "" : parseInt(value) || "" })
                  }}
                  placeholder="Enter years"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rating">Rating (0-5)</Label>
                <Input
                  id="rating"
                  type="number"
                  value={formData.rating}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === "") {
                      setFormData({ ...formData, rating: "" })
                    } else {
                      const numValue = parseFloat(value)
                      if (!isNaN(numValue)) {
                        setFormData({ ...formData, rating: Math.min(5, Math.max(0, numValue)) })
                      }
                    }
                  }}
                  placeholder="Enter rating"
                  min="0"
                  max="5"
                  step="0.1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price per Day (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => {
                    const value = e.target.value
                    setFormData({ ...formData, price: value === "" ? "" : parseFloat(value) || "" })
                  }}
                  placeholder="Enter price"
                  min="0"
                  step="1"
                />
              </div>

              
              <div className="space-y-2">
                <Label htmlFor="badge">Badge</Label>
                <Select
                  value={formData.badge}
                  onValueChange={(value: string) => 
                    setFormData({ ...formData, badge: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Badge" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Local Expert">Local Expert</SelectItem>
                    <SelectItem value="Trek Expert">Trek Expert</SelectItem>
                    <SelectItem value="Culture Expert">Culture Expert</SelectItem>
                    <SelectItem value="Adventure Expert">Adventure Expert</SelectItem>
                    <SelectItem value="Food Expert">Food Expert</SelectItem>
                    <SelectItem value="Heritage Expert">Heritage Expert</SelectItem>
                  </SelectContent>
                </Select>
      
            </div>
            </div>

           

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profileImage">Profile Image</Label>
                <Input
                  id="profileImage"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setSelectedProfileImage(file)
                      const reader = new FileReader()
                      reader.onloadend = () => {
                        setProfileImagePreview(reader.result as string)
                      }
                      reader.readAsDataURL(file)
                    }
                  }}
                  className="cursor-pointer"
                />
                {profileImagePreview && (
                  <div className="mt-2">
                    <img 
                      src={profileImagePreview} 
                      alt="Profile preview" 
                      className="w-24 h-24 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setProfileImagePreview("")
                        setSelectedProfileImage(null)
                      }}
                      className="mt-1 text-sm text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="backgroundImage">Background Image</Label>
                <Input
                  id="backgroundImage"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setSelectedBackgroundImage(file)
                      const reader = new FileReader()
                      reader.onloadend = () => {
                        setBackgroundImagePreview(reader.result as string)
                      }
                      reader.readAsDataURL(file)
                    }
                  }}
                  className="cursor-pointer"
                />
                {backgroundImagePreview && (
                  <div className="mt-2">
                    <img 
                      src={backgroundImagePreview} 
                      alt="Background preview" 
                      className="w-full h-32 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setBackgroundImagePreview("")
                        setSelectedBackgroundImage(null)
                      }}
                      className="mt-1 text-sm text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>


            <div className="space-y-2">
              <Label>Specialization</Label>
              <div className="space-y-3">
                {/* Main Categories */}
                <div className="grid grid-cols-4 gap-2 border rounded p-2">
                  {Object.keys(specializationOptions).map((mainSpec) => (
                    <label key={mainSpec} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedMainSpecializations.includes(mainSpec)}
                        onChange={() => toggleMainSpecialization(mainSpec)}
                      />
                      <span className="text-sm font-medium">{mainSpec}</span>
                    </label>
                  ))}
                </div>
                
                {/* Sub-categories for selected main categories */}
                {selectedMainSpecializations.length > 0 && (
                  <div className="space-y-2">
                    {selectedMainSpecializations.map((mainSpec) => (
                      <div key={mainSpec} className="border rounded p-3">
                        <div className="font-medium text-sm mb-2">{mainSpec} Options:</div>
                        <div className="grid grid-cols-3 gap-2">
                          {specializationOptions[mainSpec].map((subSpec) => {
                            const fullSubSpec = `${mainSpec} - ${subSpec}`
                            return (
                              <label key={subSpec} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formData.specialization.includes(fullSubSpec)}
                                  onChange={() => toggleSubSpecialization(mainSpec, subSpec)}
                                />
                                <span className="text-sm">{subSpec}</span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Languages</Label>
              <div className="grid grid-cols-4 gap-2 border rounded p-2">
                {languageOptions.map((lang) => (
                  <label key={lang} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.languages.includes(lang)}
                      onChange={() => toggleLanguage(lang)}
                    />
                    <span className="text-sm">{lang}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Traveler Category</Label>
              <div className="grid grid-cols-4 gap-2 border rounded p-2">
                {categoryOptions.map((cat) => (
                  <label key={cat} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.category.includes(cat)}
                      onChange={() => {
                        setFormData({
                          ...formData,
                          category: formData.category.includes(cat)
                            ? formData.category.filter(c => c !== cat)
                            : [...formData.category, cat]
                        })
                      }}
                    />
                    <span className="text-sm">{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="photos">Upload Photos</Label>
              <Input
                id="photos"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || [])
                  const newPhotos = [...selectedPhotos, ...files]
                  setSelectedPhotos(newPhotos)
                  // Create previews for new files
                  files.forEach(file => {
                    const reader = new FileReader()
                    reader.onloadend = () => {
                      setPhotoPreviews(prev => [...prev, reader.result as string])
                    }
                    reader.readAsDataURL(file)
                  })
                }}
                className="cursor-pointer"
              />
              {photoPreviews.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {photoPreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img 
                        src={preview} 
                        alt={`Preview ${index + 1}`} 
                        className="w-full h-24 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newPreviews = photoPreviews.filter((_, i) => i !== index)
                          setPhotoPreviews(newPreviews)
                          const newFiles = selectedPhotos.filter((_, i) => i !== index)
                          setSelectedPhotos(newFiles)
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="documents">Document (Aadhar Card)</Label>
              <Input
                id="documents"
                type="file"
                accept="image/*,.pdf"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || [])
                  const newDocuments = [...selectedDocuments, ...files]
                  setSelectedDocuments(newDocuments)
                  // Create previews for images only
                  files.forEach(file => {
                    if (file.type.startsWith('image/')) {
                      const reader = new FileReader()
                      reader.onloadend = () => {
                        setDocumentPreviews(prev => [...prev, reader.result as string])
                      }
                      reader.readAsDataURL(file)
                    } else {
                      // For PDFs, just show the filename
                      setDocumentPreviews(prev => [...prev, file.name])
                    }
                  })
                }}
                className="cursor-pointer"
              />
              <p className="text-sm text-muted-foreground">Upload PDF or Photos of Aadhar Card</p>
              {documentPreviews.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {documentPreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      {preview.startsWith('data:') || preview.startsWith('http') ? (
                        <img 
                          src={preview} 
                          alt={`Document ${index + 1}`} 
                          className="w-full h-24 object-cover rounded border"
                        />
                      ) : (
                        <div className="w-full h-24 border rounded flex items-center justify-center bg-gray-100">
                          <span className="text-xs text-center px-2">{preview}</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const newPreviews = documentPreviews.filter((_, i) => i !== index)
                          setDocumentPreviews(newPreviews)
                          const newFiles = selectedDocuments.filter((_, i) => i !== index)
                          setSelectedDocuments(newFiles)
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Captain bio..."
                rows={4}
              />
            </div>

            {/* Bank Details Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Bank Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="space-y-2 md:col-span-6">
                  <Label htmlFor="accountHolderName">Account Holder Name</Label>
                  <Input
                    id="accountHolderName"
                    value={formData.bankDetails.accountHolderName}
                    onChange={(e) => setFormData({
                      ...formData,
                      bankDetails: { ...formData.bankDetails, accountHolderName: e.target.value }
                    })}
                    placeholder="Account holder name"
                  />
                </div>
                <div className="space-y-2 md:col-span-6">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    value={formData.bankDetails.accountNumber}
                    onChange={(e) => setFormData({
                      ...formData,
                      bankDetails: { ...formData.bankDetails, accountNumber: e.target.value }
                    })}
                    placeholder="Account number"
                  />
                </div>
                <div className="space-y-2 md:col-span-6">
                  <Label htmlFor="ifscCode">IFSC Code</Label>
                  <Input
                    id="ifscCode"
                    value={formData.bankDetails.ifscCode}
                    onChange={(e) => setFormData({
                      ...formData,
                      bankDetails: { ...formData.bankDetails, ifscCode: e.target.value.toUpperCase() }
                    })}
                    placeholder="IFSC code"
                    maxLength={11}
                  />
                </div>
                <div className="space-y-2 md:col-span-6">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    value={formData.bankDetails.bankName}
                    onChange={(e) => setFormData({
                      ...formData,
                      bankDetails: { ...formData.bankDetails, bankName: e.target.value }
                    })}
                    placeholder="Bank name"
                  />
                </div>
                <div className="space-y-2 md:col-span-6">
                  <Label htmlFor="branchName">Branch Name</Label>
                  <Input
                    id="branchName"
                    value={formData.bankDetails.branchName}
                    onChange={(e) => setFormData({
                      ...formData,
                      bankDetails: { ...formData.bankDetails, branchName: e.target.value }
                    })}
                    placeholder="Branch name"
                  />
                </div>
                <div className="space-y-2 md:col-span-6">
                  <Label htmlFor="accountType">Account Type</Label>
                  <Select
                    value={formData.bankDetails.accountType}
                    onValueChange={(value: "savings" | "current") => 
                      setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails, accountType: value }
                      })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="savings">Savings</SelectItem>
                      <SelectItem value="current">Current</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-6">
                  <Label htmlFor="upiId">UPI ID (Optional)</Label>
                  <Input
                    id="upiId"
                    value={formData.bankDetails.upiId}
                    onChange={(e) => setFormData({
                      ...formData,
                      bankDetails: { ...formData.bankDetails, upiId: e.target.value }
                    })}
                    placeholder="e.g., name@paytm, name@phonepe"
                  />
                </div>
              </div>
            </div>

            {captainId && captainId !== 'new' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="space-y-2 md:col-span-6">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "active" | "inactive" | "on-leave") => 
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="on-leave">On Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

                <div className="flex gap-4 justify-end pt-4">
                  <Button type="button" variant="outline" onClick={() => router.push('/admin/captain/details')}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Saving...' : isNewCaptain ? 'Create Captain' : 'Update Captain'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="availability" className="mt-4 pb-0">
          {isNewCaptain ? (
            <Card>
              <CardContent className="pt-6 pb-6">
                <div className="text-center py-8 text-muted-foreground">
                  Please save the captain details first to manage availability.
                </div>
              </CardContent>
            </Card>
          ) : (
            captainId && <CaptainAvailabilityTab captainId={captainId} />
          )}
        </TabsContent>

        <TabsContent value="payments" className="mt-4 pb-0">
          {isNewCaptain ? (
            <Card>
              <CardContent className="pt-6 pb-6">
                <div className="text-center py-8 text-muted-foreground">
                  Please save the captain details first to manage payments.
                </div>
              </CardContent>
            </Card>
          ) : (
            captainId && <CaptainPaymentTab captainId={captainId} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

