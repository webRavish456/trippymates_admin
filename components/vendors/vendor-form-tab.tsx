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
import { Plus, X } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { API_BASE_URL } from "@/lib/config"
import { EditPageSkeleton } from "@/components/ui/skeletons"

const API_BASE = `${API_BASE_URL}/api/admin/vendor`

export function VendorFormTab() {
  const router = useRouter()
  const params = useParams()
  const vendorId = params?.id as string
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(!!(vendorId && vendorId !== "new"))
  const [documentFiles, setDocumentFiles] = useState({
    aadhaarCard: null as File | null,
    panCard: null as File | null,
    license: null as File | null,
    gstCertificate: null as File | null,
    certificate: null as File | null,
    otherDocument: null as File | null
  })

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    email: "",
    phone: "",
    businessName: "",
    businessType: "",
    businessRegistrationNo: "",
    gstNo: "",
    description: "",
    operatingHours: "",
    vendorType: "hotel" as "hotel" | "transport" | "activity" | "food" | "event",
    hotelDetails: {
      roomTypes: [] as Array<{ type: string; pricePerNight: number; capacity: number; amenities: string[] }>,
      mealPlans: [] as Array<{ type: "EP" | "CP" | "MAP" | "AP"; price: number }>,
      amenities: [] as string[],
      checkInTime: "",
      checkOutTime: "",
      policies: ""
    },
    transportDetails: {
      vehicleTypes: [] as Array<{ type: string; perKmCost: number; perDayCost: number; capacity: number; driverIncluded: boolean; vehicleImages: string[] }>,
      driverDetails: {
        name: "",
        licenseNumber: "",
        phone: "",
        experience: 0
      },
      availability: true
    },
    activityDetails: {
      activityType: "trek" as string,
      perPersonCost: 0,
      minAge: 0,
      maxAge: 0,
      safetyRequirements: [] as string[],
      duration: "",
      groupSize: { min: 0, max: 0 },
      equipmentProvided: false,
      guideIncluded: false
    },
    foodDetails: {
      mealPackages: [] as Array<{ name: string; description: string; price: number; items: string[] }>,
      perPlateRates: {
        breakfast: 0,
        lunch: 0,
        dinner: 0
      },
      cuisineTypes: [] as string[],
      specialties: [] as string[],
      capacity: 0,
      servingHours: ""
    },
    eventDetails: {
      services: [] as Array<{ type: string; description: string; price: number }>,
      eventTypes: [] as string[],
      capacity: 0,
      equipmentProvided: [] as string[]
    },
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

  useEffect(() => {
    if (vendorId && vendorId !== 'new') {
      fetchVendor()
    }
  }, [vendorId])

  const fetchVendor = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${API_BASE}/getVendor?page=1&limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      
      if (data.status && data.data) {
        const vendor = data.data.find((v: any) => v._id === vendorId)
        if (vendor) {
          setFormData({
            name: vendor.name || "",
            address: vendor.address || "",
            email: vendor.email || "",
            phone: vendor.phone || "",
            businessName: vendor.businessName || "",
            businessType: vendor.businessType || "",
            businessRegistrationNo: vendor.businessRegistrationNo || "",
            gstNo: vendor.gstNo || "",
            description: vendor.description || "",
            operatingHours: vendor.operatingHours || "",
            bankDetails: {
              accountHolderName: vendor.bankDetails?.accountHolderName || "",
              accountNumber: vendor.bankDetails?.accountNumber || "",
              ifscCode: vendor.bankDetails?.ifscCode || "",
              bankName: vendor.bankDetails?.bankName || "",
              branchName: vendor.bankDetails?.branchName || "",
              accountType: vendor.bankDetails?.accountType || "savings",
              upiId: vendor.bankDetails?.upiId || ""
            }
          })
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch vendor",
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
      const url = vendorId && vendorId !== 'new' ? `${API_BASE}/updateVendor/${vendorId}` : `${API_BASE}/addVendor`
      const method = vendorId && vendorId !== 'new' ? 'PUT' : 'POST'

      // Create FormData for file uploads
      const submitFormData = new FormData()
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (key === 'bankDetails' || key === 'hotelDetails' || key === 'transportDetails' || key === 'activityDetails' || key === 'foodDetails' || key === 'eventDetails') {
          submitFormData.append(key, JSON.stringify(formData[key as keyof typeof formData]))
        } else {
          submitFormData.append(key, (formData[key as keyof typeof formData] as string) || '')
        }
      })

      // Add document files if they exist
      if (documentFiles.aadhaarCard) {
        submitFormData.append('aadhaarCard', documentFiles.aadhaarCard)
      }
      if (documentFiles.panCard) {
        submitFormData.append('panCard', documentFiles.panCard)
      }
      if (documentFiles.license) {
        submitFormData.append('license', documentFiles.license)
      }
      if (documentFiles.gstCertificate) {
        submitFormData.append('gstCertificate', documentFiles.gstCertificate)
      }
      if (documentFiles.certificate) {
        submitFormData.append('certificate', documentFiles.certificate)
      }
      if (documentFiles.otherDocument) {
        submitFormData.append('otherDocument', documentFiles.otherDocument)
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type, let browser set it with boundary for FormData
        },
        body: submitFormData
      })

      const data = await response.json()

      if (data.status) {
        toast({
          title: "Success",
          description: vendorId && vendorId !== 'new' ? "Vendor updated successfully" : "Vendor created successfully",
        })
        router.push('/admin/vendors')
      } else {
        throw new Error(data.message || "Failed to save vendor")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save vendor",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return <EditPageSkeleton />
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Vendor Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="vendorType">Vendor Type *</Label>
              <Select
                value={formData.vendorType}
                  onValueChange={(value: "hotel" | "transport" | "activity" | "food" | "event") => {
                  // Reset type-specific data when changing vendor type
                  const resetData: any = { ...formData, vendorType: value }
                  if (value !== 'hotel') resetData.hotelDetails = { roomTypes: [], mealPlans: [], amenities: [], checkInTime: "", checkOutTime: "", policies: "" }
                  if (value !== 'transport') resetData.transportDetails = { vehicleTypes: [], driverDetails: { name: "", licenseNumber: "", phone: "", experience: 0 }, availability: true }
                  if (value !== 'activity') resetData.activityDetails = { activityType: "trek", perPersonCost: 0, minAge: 0, maxAge: 0, safetyRequirements: [], duration: "", groupSize: { min: 0, max: 0 }, equipmentProvided: false, guideIncluded: false }
                  if (value !== 'food') resetData.foodDetails = { mealPackages: [], perPlateRates: { breakfast: 0, lunch: 0, dinner: 0 }, cuisineTypes: [], specialties: [], capacity: 0, servingHours: "" }
                  if (value !== 'event') resetData.eventDetails = { services: [], eventTypes: [], capacity: 0, equipmentProvided: [] }
                  setFormData(resetData)
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select vendor type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="hotel">Hotel</SelectItem>
                    <SelectItem value="transport">Transport</SelectItem>
                    <SelectItem value="activity">Activity</SelectItem>
                    <SelectItem value="food">Food/Restaurant</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="space-y-2 md:col-span-6">
                <Label htmlFor="name">Vendor Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-6">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="vendor@example.com"
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-6">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 9876543210"
                />
              </div>
              <div className="space-y-2 md:col-span-6">
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  placeholder="Doe Enterprises"
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-6">
                <Label htmlFor="businessType">Business Type</Label>
                <Select
                  value={formData.businessType}
                  onValueChange={(value) => setFormData({ ...formData, businessType: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="wholesale">Wholesale</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="hospitality">Hospitality</SelectItem>
                    <SelectItem value="tourism">Tourism</SelectItem>
                    <SelectItem value="travel">Travel</SelectItem>
                    <SelectItem value="transportation">Transportation</SelectItem>
                    <SelectItem value="logistics">Logistics</SelectItem>
                    <SelectItem value="food_beverage">Food & Beverage</SelectItem>
                    <SelectItem value="restaurant">Restaurant</SelectItem>
                    <SelectItem value="catering">Catering</SelectItem>
                    <SelectItem value="entertainment">Entertainment</SelectItem>
                    <SelectItem value="event_management">Event Management</SelectItem>
                    <SelectItem value="adventure_sports">Adventure Sports</SelectItem>
                    <SelectItem value="outdoor_activities">Outdoor Activities</SelectItem>
                    <SelectItem value="accommodation">Accommodation</SelectItem>
                    <SelectItem value="hospitality_services">Hospitality Services</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-6">
                <Label htmlFor="businessRegistrationNo">Business Registration No</Label>
                <Input
                  id="businessRegistrationNo"
                  value={formData.businessRegistrationNo}
                  onChange={(e) => setFormData({ ...formData, businessRegistrationNo: e.target.value })}
                  placeholder="CIN98099888IN"
                />
              </div>
              <div className="space-y-2 md:col-span-6">
                <Label htmlFor="gstNo">GST Number</Label>
                <Input
                  id="gstNo"
                  value={formData.gstNo}
                  onChange={(e) => setFormData({ ...formData, gstNo: e.target.value })}
                  placeholder="20AAnj8899900"
                />
              </div>
              <div className="space-y-2 md:col-span-6">
                <Label htmlFor="operatingHours">Operating Hours</Label>
                <Input
                  id="operatingHours"
                  value={formData.operatingHours}
                  onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
                  placeholder="Mon-Fri 9am-6pm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main Street, City, Country"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the vendor's business"
                rows={3}
              />
            </div>

            {/* Vendor Type Specific Fields */}
            {formData.vendorType === 'hotel' && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Hotel Details</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Check-in Time</Label>
                      <Input
                        type="time"
                        value={formData.hotelDetails.checkInTime}
                        onChange={(e) => setFormData({
                          ...formData,
                          hotelDetails: { ...formData.hotelDetails, checkInTime: e.target.value }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Check-out Time</Label>
                      <Input
                        type="time"
                        value={formData.hotelDetails.checkOutTime}
                        onChange={(e) => setFormData({
                          ...formData,
                          hotelDetails: { ...formData.hotelDetails, checkOutTime: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Policies</Label>
                    <Textarea
                      value={formData.hotelDetails.policies}
                      onChange={(e) => setFormData({
                        ...formData,
                        hotelDetails: { ...formData.hotelDetails, policies: e.target.value }
                      })}
                      placeholder="Hotel policies and rules"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Amenities (comma separated)</Label>
                    <Input
                      placeholder="WiFi, Pool, Gym, Spa, etc."
                      onBlur={(e) => {
                        const amenities = e.target.value.split(',').map(a => a.trim()).filter(a => a)
                        setFormData({
                          ...formData,
                          hotelDetails: { ...formData.hotelDetails, amenities }
                        })
                      }}
                    />
                    {formData.hotelDetails.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.hotelDetails.amenities.map((amenity, idx) => (
                          <span key={idx} className="px-2 py-1 bg-muted rounded text-sm">{amenity}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Room Types */}
                  <div className="space-y-2">
                    <Label>Room Types</Label>
                    {formData.hotelDetails.roomTypes.map((room, idx) => (
                      <div key={idx} className="border p-3 rounded space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Room {idx + 1}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newRoomTypes = formData.hotelDetails.roomTypes.filter((_, i) => i !== idx)
                              setFormData({
                                ...formData,
                                hotelDetails: { ...formData.hotelDetails, roomTypes: newRoomTypes }
                              })
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            placeholder="Type (Deluxe/Standard/Suite)"
                            value={room.type}
                            onChange={(e) => {
                              const newRoomTypes = [...formData.hotelDetails.roomTypes]
                              newRoomTypes[idx] = { ...room, type: e.target.value }
                              setFormData({
                                ...formData,
                                hotelDetails: { ...formData.hotelDetails, roomTypes: newRoomTypes }
                              })
                            }}
                          />
                          <Input
                            type="number"
                            placeholder="Price per night (₹)"
                            value={room.pricePerNight}
                            onChange={(e) => {
                              const newRoomTypes = [...formData.hotelDetails.roomTypes]
                              newRoomTypes[idx] = { ...room, pricePerNight: parseFloat(e.target.value) || 0 }
                              setFormData({
                                ...formData,
                                hotelDetails: { ...formData.hotelDetails, roomTypes: newRoomTypes }
                              })
                            }}
                          />
                          <Input
                            type="number"
                            placeholder="Capacity"
                            value={room.capacity}
                            onChange={(e) => {
                              const newRoomTypes = [...formData.hotelDetails.roomTypes]
                              newRoomTypes[idx] = { ...room, capacity: parseInt(e.target.value) || 0 }
                              setFormData({
                                ...formData,
                                hotelDetails: { ...formData.hotelDetails, roomTypes: newRoomTypes }
                              })
                            }}
                          />
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          hotelDetails: {
                            ...formData.hotelDetails,
                            roomTypes: [...formData.hotelDetails.roomTypes, { type: "", pricePerNight: 0, capacity: 0, amenities: [] }]
                          }
                        })
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Room Type
                    </Button>
                  </div>

                  {/* Meal Plans */}
                  <div className="space-y-2">
                    <Label>Meal Plans</Label>
                    {formData.hotelDetails.mealPlans.map((plan, idx) => (
                      <div key={idx} className="border p-3 rounded space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Meal Plan {idx + 1}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newMealPlans = formData.hotelDetails.mealPlans.filter((_, i) => i !== idx)
                              setFormData({
                                ...formData,
                                hotelDetails: { ...formData.hotelDetails, mealPlans: newMealPlans }
                              })
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Select
                            value={plan.type}
                            onValueChange={(value: "EP" | "CP" | "MAP" | "AP") => {
                              const newMealPlans = [...formData.hotelDetails.mealPlans]
                              newMealPlans[idx] = { ...plan, type: value }
                              setFormData({
                                ...formData,
                                hotelDetails: { ...formData.hotelDetails, mealPlans: newMealPlans }
                              })
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select meal plan" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="EP">EP (European Plan - Room Only)</SelectItem>
                              <SelectItem value="CP">CP (Continental Plan - Breakfast)</SelectItem>
                              <SelectItem value="MAP">MAP (Modified American Plan - Breakfast + Dinner)</SelectItem>
                              <SelectItem value="AP">AP (American Plan - All Meals)</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            placeholder="Price (₹)"
                            value={plan.price}
                            onChange={(e) => {
                              const newMealPlans = [...formData.hotelDetails.mealPlans]
                              newMealPlans[idx] = { ...plan, price: parseFloat(e.target.value) || 0 }
                              setFormData({
                                ...formData,
                                hotelDetails: { ...formData.hotelDetails, mealPlans: newMealPlans }
                              })
                            }}
                          />
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          hotelDetails: {
                            ...formData.hotelDetails,
                            mealPlans: [...formData.hotelDetails.mealPlans, { type: "EP", price: 0 }]
                          }
                        })
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Meal Plan
                    </Button>
                  </div>

                  {/* Room Availability Section */}
                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-md font-semibold mb-3">Room Availability</h4>
                    <div className="space-y-3">
                      {formData.hotelDetails.roomTypes.map((room, idx) => (
                        <div key={idx} className="border p-3 rounded">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">{room.type || `Room Type ${idx + 1}`}</span>
                            <Badge variant={room.capacity > 0 ? "default" : "secondary"}>
                              {room.capacity > 0 ? `${room.capacity} rooms available` : "No rooms"}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Total Rooms</Label>
                              <Input
                                type="number"
                                placeholder="Total rooms"
                                value={room.capacity}
                                onChange={(e) => {
                                  const newRoomTypes = [...formData.hotelDetails.roomTypes]
                                  newRoomTypes[idx] = { ...room, capacity: parseInt(e.target.value) || 0 }
                                  setFormData({
                                    ...formData,
                                    hotelDetails: { ...formData.hotelDetails, roomTypes: newRoomTypes }
                                  })
                                }}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Available Rooms</Label>
                              <Input
                                type="number"
                                placeholder="Available now"
                                value={room.capacity}
                                readOnly
                                className="bg-muted"
                              />
                            </div>
                          </div>
                          <div className="mt-2 text-sm text-muted-foreground">
                            Price: ₹{room.pricePerNight}/night
                          </div>
                        </div>
                      ))}
                      {formData.hotelDetails.roomTypes.length === 0 && (
                        <p className="text-sm text-muted-foreground">Add room types above to manage availability</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {formData.vendorType === 'transport' && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Transport Details</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Driver Name</Label>
                      <Input
                        value={formData.transportDetails.driverDetails.name}
                        onChange={(e) => setFormData({
                          ...formData,
                          transportDetails: {
                            ...formData.transportDetails,
                            driverDetails: { ...formData.transportDetails.driverDetails, name: e.target.value }
                          }
                        })}
                        placeholder="Driver name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Driver License Number</Label>
                      <Input
                        value={formData.transportDetails.driverDetails.licenseNumber}
                        onChange={(e) => setFormData({
                          ...formData,
                          transportDetails: {
                            ...formData.transportDetails,
                            driverDetails: { ...formData.transportDetails.driverDetails, licenseNumber: e.target.value }
                          }
                        })}
                        placeholder="License number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Driver Phone</Label>
                      <Input
                        value={formData.transportDetails.driverDetails.phone}
                        onChange={(e) => setFormData({
                          ...formData,
                          transportDetails: {
                            ...formData.transportDetails,
                            driverDetails: { ...formData.transportDetails.driverDetails, phone: e.target.value }
                          }
                        })}
                        placeholder="Driver phone"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Driver Experience (Years)</Label>
                      <Input
                        type="number"
                        value={formData.transportDetails.driverDetails.experience}
                        onChange={(e) => setFormData({
                          ...formData,
                          transportDetails: {
                            ...formData.transportDetails,
                            driverDetails: { ...formData.transportDetails.driverDetails, experience: parseInt(e.target.value) || 0 }
                          }
                        })}
                        placeholder="Years of experience"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.transportDetails.availability}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        transportDetails: { ...formData.transportDetails, availability: checked }
                      })}
                    />
                    <Label>Vehicle Available</Label>
                  </div>

                  {/* Vehicle Types */}
                  <div className="space-y-2">
                    <Label>Vehicle Types</Label>
                    {formData.transportDetails.vehicleTypes.map((vehicle, idx) => (
                      <div key={idx} className="border p-3 rounded space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Vehicle {idx + 1}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newVehicles = formData.transportDetails.vehicleTypes.filter((_, i) => i !== idx)
                              setFormData({
                                ...formData,
                                transportDetails: { ...formData.transportDetails, vehicleTypes: newVehicles }
                              })
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Select
                            value={vehicle.type}
                            onValueChange={(value) => {
                              const newVehicles = [...formData.transportDetails.vehicleTypes]
                              newVehicles[idx] = { ...vehicle, type: value }
                              setFormData({
                                ...formData,
                                transportDetails: { ...formData.transportDetails, vehicleTypes: newVehicles }
                              })
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select vehicle type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sedan">Sedan</SelectItem>
                              <SelectItem value="suv">SUV</SelectItem>
                              <SelectItem value="tempo_traveller">Tempo Traveller</SelectItem>
                              <SelectItem value="bus">Bus</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            placeholder="Capacity"
                            value={vehicle.capacity}
                            onChange={(e) => {
                              const newVehicles = [...formData.transportDetails.vehicleTypes]
                              newVehicles[idx] = { ...vehicle, capacity: parseInt(e.target.value) || 0 }
                              setFormData({
                                ...formData,
                                transportDetails: { ...formData.transportDetails, vehicleTypes: newVehicles }
                              })
                            }}
                          />
                          <Input
                            type="number"
                            placeholder="Per KM Cost (₹)"
                            value={vehicle.perKmCost}
                            onChange={(e) => {
                              const newVehicles = [...formData.transportDetails.vehicleTypes]
                              newVehicles[idx] = { ...vehicle, perKmCost: parseFloat(e.target.value) || 0 }
                              setFormData({
                                ...formData,
                                transportDetails: { ...formData.transportDetails, vehicleTypes: newVehicles }
                              })
                            }}
                          />
                          <Input
                            type="number"
                            placeholder="Per Day Cost (₹)"
                            value={vehicle.perDayCost}
                            onChange={(e) => {
                              const newVehicles = [...formData.transportDetails.vehicleTypes]
                              newVehicles[idx] = { ...vehicle, perDayCost: parseFloat(e.target.value) || 0 }
                              setFormData({
                                ...formData,
                                transportDetails: { ...formData.transportDetails, vehicleTypes: newVehicles }
                              })
                            }}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={vehicle.driverIncluded}
                            onCheckedChange={(checked) => {
                              const newVehicles = [...formData.transportDetails.vehicleTypes]
                              newVehicles[idx] = { ...vehicle, driverIncluded: checked }
                              setFormData({
                                ...formData,
                                transportDetails: { ...formData.transportDetails, vehicleTypes: newVehicles }
                              })
                            }}
                          />
                          <Label>Driver Included</Label>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          transportDetails: {
                            ...formData.transportDetails,
                            vehicleTypes: [...formData.transportDetails.vehicleTypes, {
                              type: "",
                              perKmCost: 0,
                              perDayCost: 0,
                              capacity: 0,
                              driverIncluded: false,
                              vehicleImages: []
                            }]
                          }
                        })
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Vehicle Type
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {formData.vendorType === 'activity' && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Activity Details</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Activity Type</Label>
                      <Select
                        value={formData.activityDetails.activityType}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          activityDetails: { ...formData.activityDetails, activityType: value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="trek">Trek</SelectItem>
                          <SelectItem value="scuba_diving">Scuba Diving</SelectItem>
                          <SelectItem value="rafting">Rafting</SelectItem>
                          <SelectItem value="safari">Safari</SelectItem>
                          <SelectItem value="camping">Camping</SelectItem>
                          <SelectItem value="paragliding">Paragliding</SelectItem>
                          <SelectItem value="bungee_jumping">Bungee Jumping</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Per Person Cost (₹)</Label>
                      <Input
                        type="number"
                        value={formData.activityDetails.perPersonCost}
                        onChange={(e) => setFormData({
                          ...formData,
                          activityDetails: { ...formData.activityDetails, perPersonCost: parseFloat(e.target.value) || 0 }
                        })}
                        placeholder="Cost per person"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Minimum Age</Label>
                      <Input
                        type="number"
                        value={formData.activityDetails.minAge}
                        onChange={(e) => setFormData({
                          ...formData,
                          activityDetails: { ...formData.activityDetails, minAge: parseInt(e.target.value) || 0 }
                        })}
                        placeholder="Minimum age"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Maximum Age</Label>
                      <Input
                        type="number"
                        value={formData.activityDetails.maxAge}
                        onChange={(e) => setFormData({
                          ...formData,
                          activityDetails: { ...formData.activityDetails, maxAge: parseInt(e.target.value) || 0 }
                        })}
                        placeholder="Maximum age"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <Input
                        value={formData.activityDetails.duration}
                        onChange={(e) => setFormData({
                          ...formData,
                          activityDetails: { ...formData.activityDetails, duration: e.target.value }
                        })}
                        placeholder="e.g., 2 hours, Full day"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Group Size (Min)</Label>
                      <Input
                        type="number"
                        value={formData.activityDetails.groupSize.min}
                        onChange={(e) => setFormData({
                          ...formData,
                          activityDetails: {
                            ...formData.activityDetails,
                            groupSize: { ...formData.activityDetails.groupSize, min: parseInt(e.target.value) || 0 }
                          }
                        })}
                        placeholder="Minimum group size"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Group Size (Max)</Label>
                      <Input
                        type="number"
                        value={formData.activityDetails.groupSize.max}
                        onChange={(e) => setFormData({
                          ...formData,
                          activityDetails: {
                            ...formData.activityDetails,
                            groupSize: { ...formData.activityDetails.groupSize, max: parseInt(e.target.value) || 0 }
                          }
                        })}
                        placeholder="Maximum group size"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.activityDetails.equipmentProvided}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        activityDetails: { ...formData.activityDetails, equipmentProvided: checked }
                      })}
                    />
                    <Label>Equipment Provided</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.activityDetails.guideIncluded}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        activityDetails: { ...formData.activityDetails, guideIncluded: checked }
                      })}
                    />
                    <Label>Guide Included</Label>
                  </div>
                  <div className="space-y-2">
                    <Label>Safety Requirements (comma separated)</Label>
                    <Input
                      placeholder="Helmet, Life jacket, etc."
                      onBlur={(e) => {
                        const requirements = e.target.value.split(',').map(r => r.trim()).filter(r => r)
                        setFormData({
                          ...formData,
                          activityDetails: { ...formData.activityDetails, safetyRequirements: requirements }
                        })
                      }}
                    />
                    {formData.activityDetails.safetyRequirements.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.activityDetails.safetyRequirements.map((req, idx) => (
                          <span key={idx} className="px-2 py-1 bg-muted rounded text-sm">{req}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Activity Availability Section */}
                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-md font-semibold mb-3">Activity Availability</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select
                          value={formData.activityDetails.equipmentProvided ? "available" : "unavailable"}
                          onValueChange={(value) => setFormData({
                            ...formData,
                            activityDetails: { ...formData.activityDetails, equipmentProvided: value === "available" }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="unavailable">Unavailable</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Group Size Available</Label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Min"
                            value={formData.activityDetails.groupSize.min}
                            onChange={(e) => setFormData({
                              ...formData,
                              activityDetails: {
                                ...formData.activityDetails,
                                groupSize: { ...formData.activityDetails.groupSize, min: parseInt(e.target.value) || 0 }
                              }
                            })}
                          />
                          <Input
                            type="number"
                            placeholder="Max"
                            value={formData.activityDetails.groupSize.max}
                            onChange={(e) => setFormData({
                              ...formData,
                              activityDetails: {
                                ...formData.activityDetails,
                                groupSize: { ...formData.activityDetails.groupSize, max: parseInt(e.target.value) || 0 }
                              }
                            })}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-muted rounded">
                      <div className="text-sm">
                        <strong>Per Person Cost:</strong> ₹{formData.activityDetails.perPersonCost || 0}
                      </div>
                      <div className="text-sm mt-1">
                        <strong>Duration:</strong> {formData.activityDetails.duration || "Not specified"}
                      </div>
                      <div className="text-sm mt-1">
                        <strong>Age Range:</strong> {formData.activityDetails.minAge || 0} - {formData.activityDetails.maxAge || 0} years
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {formData.vendorType === 'food' && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Food/Restaurant Details</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Breakfast Rate (₹)</Label>
                      <Input
                        type="number"
                        value={formData.foodDetails.perPlateRates.breakfast}
                        onChange={(e) => setFormData({
                          ...formData,
                          foodDetails: {
                            ...formData.foodDetails,
                            perPlateRates: { ...formData.foodDetails.perPlateRates, breakfast: parseFloat(e.target.value) || 0 }
                          }
                        })}
                        placeholder="Per plate"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Lunch Rate (₹)</Label>
                      <Input
                        type="number"
                        value={formData.foodDetails.perPlateRates.lunch}
                        onChange={(e) => setFormData({
                          ...formData,
                          foodDetails: {
                            ...formData.foodDetails,
                            perPlateRates: { ...formData.foodDetails.perPlateRates, lunch: parseFloat(e.target.value) || 0 }
                          }
                        })}
                        placeholder="Per plate"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Dinner Rate (₹)</Label>
                      <Input
                        type="number"
                        value={formData.foodDetails.perPlateRates.dinner}
                        onChange={(e) => setFormData({
                          ...formData,
                          foodDetails: {
                            ...formData.foodDetails,
                            perPlateRates: { ...formData.foodDetails.perPlateRates, dinner: parseFloat(e.target.value) || 0 }
                          }
                        })}
                        placeholder="Per plate"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Capacity</Label>
                      <Input
                        type="number"
                        value={formData.foodDetails.capacity}
                        onChange={(e) => setFormData({
                          ...formData,
                          foodDetails: { ...formData.foodDetails, capacity: parseInt(e.target.value) || 0 }
                        })}
                        placeholder="Number of seats"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Serving Hours</Label>
                      <Input
                        value={formData.foodDetails.servingHours}
                        onChange={(e) => setFormData({
                          ...formData,
                          foodDetails: { ...formData.foodDetails, servingHours: e.target.value }
                        })}
                        placeholder="e.g., 7am-11pm"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Cuisine Types (comma separated)</Label>
                    <Input
                      placeholder="Indian, Chinese, Continental, etc."
                      onBlur={(e) => {
                        const cuisines = e.target.value.split(',').map(c => c.trim()).filter(c => c)
                        setFormData({
                          ...formData,
                          foodDetails: { ...formData.foodDetails, cuisineTypes: cuisines }
                        })
                      }}
                    />
                    {formData.foodDetails.cuisineTypes.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.foodDetails.cuisineTypes.map((cuisine, idx) => (
                          <span key={idx} className="px-2 py-1 bg-muted rounded text-sm">{cuisine}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Specialties (comma separated)</Label>
                    <Input
                      placeholder="Signature dishes"
                      onBlur={(e) => {
                        const specialties = e.target.value.split(',').map(s => s.trim()).filter(s => s)
                        setFormData({
                          ...formData,
                          foodDetails: { ...formData.foodDetails, specialties }
                        })
                      }}
                    />
                    {formData.foodDetails.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.foodDetails.specialties.map((specialty, idx) => (
                          <span key={idx} className="px-2 py-1 bg-muted rounded text-sm">{specialty}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {formData.vendorType === 'event' && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Event Details</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Capacity</Label>
                    <Input
                      type="number"
                      value={formData.eventDetails.capacity}
                      onChange={(e) => setFormData({
                        ...formData,
                        eventDetails: { ...formData.eventDetails, capacity: parseInt(e.target.value) || 0 }
                      })}
                      placeholder="Event capacity"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Event Types (comma separated)</Label>
                    <Input
                      placeholder="Wedding, Corporate, Birthday, etc."
                      onBlur={(e) => {
                        const eventTypes = e.target.value.split(',').map(e => e.trim()).filter(e => e)
                        setFormData({
                          ...formData,
                          eventDetails: { ...formData.eventDetails, eventTypes }
                        })
                      }}
                    />
                    {formData.eventDetails.eventTypes.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.eventDetails.eventTypes.map((type, idx) => (
                          <span key={idx} className="px-2 py-1 bg-muted rounded text-sm">{type}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Equipment Provided (comma separated)</Label>
                    <Input
                      placeholder="Sound system, Lights, etc."
                      onBlur={(e) => {
                        const equipment = e.target.value.split(',').map(e => e.trim()).filter(e => e)
                        setFormData({
                          ...formData,
                          eventDetails: { ...formData.eventDetails, equipmentProvided: equipment }
                        })
                      }}
                    />
                    {formData.eventDetails.equipmentProvided.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.eventDetails.equipmentProvided.map((eq, idx) => (
                          <span key={idx} className="px-2 py-1 bg-muted rounded text-sm">{eq}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Event Availability Section */}
                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-md font-semibold mb-3">Event Services Availability</h4>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Event Capacity</Label>
                          <Input
                            type="number"
                            value={formData.eventDetails.capacity}
                            onChange={(e) => setFormData({
                              ...formData,
                              eventDetails: { ...formData.eventDetails, capacity: parseInt(e.target.value) || 0 }
                            })}
                            placeholder="Event capacity"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Available Services</Label>
                          <div className="text-sm text-muted-foreground">
                            {formData.eventDetails.eventTypes.length > 0 
                              ? formData.eventDetails.eventTypes.join(", ")
                              : "No event types specified"}
                          </div>
                        </div>
                      </div>
                      {formData.eventDetails.equipmentProvided.length > 0 && (
                        <div className="p-3 bg-muted rounded">
                          <div className="text-sm font-semibold mb-1">Equipment Available:</div>
                          <div className="flex flex-wrap gap-2">
                            {formData.eventDetails.equipmentProvided.map((eq, idx) => (
                              <Badge key={idx} variant="secondary">{eq}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Documents Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="aadhaarCard">Aadhaar Card</Label>
                  <Input
                    id="aadhaarCard"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setDocumentFiles({ ...documentFiles, aadhaarCard: file })
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">Upload Aadhaar card (Image or PDF)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="panCard">PAN Card</Label>
                  <Input
                    id="panCard"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setDocumentFiles({ ...documentFiles, panCard: file })
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">Upload PAN card (Image or PDF)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license">License</Label>
                  <Input
                    id="license"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setDocumentFiles({ ...documentFiles, license: file })
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">Upload license document (Image or PDF)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gstCertificate">GST Certificate</Label>
                  <Input
                    id="gstCertificate"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setDocumentFiles({ ...documentFiles, gstCertificate: file })
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">Upload GST certificate (Image or PDF)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="certificate">Certificate</Label>
                  <Input
                    id="certificate"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setDocumentFiles({ ...documentFiles, certificate: file })
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">Upload certificate document (Image or PDF)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otherDocument">Other Document</Label>
                  <Input
                    id="otherDocument"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setDocumentFiles({ ...documentFiles, otherDocument: file })
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">Upload any other document (Image or PDF)</p>
                </div>
              </div>
            </div>

            {/* Bank Details Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Bank Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
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
                <div className="space-y-2">
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
                <div className="space-y-2">
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
                <div className="space-y-2">
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
                <div className="space-y-2">
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
                <div className="space-y-2 md:w-1/2">
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
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="savings">Savings</SelectItem>
                      <SelectItem value="current">Current</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
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

            <div className="flex gap-4 justify-end">
              <Button type="button" variant="outline" onClick={() => router.push('/admin/vendors')}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Saving...' : vendorId && vendorId !== 'new' ? 'Update Vendor' : 'Create Vendor'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}

