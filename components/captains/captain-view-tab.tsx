"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CaptainAvailabilityTab } from "./captain-availability-tab"
import { CaptainPaymentTab } from "./captain-payment-tab"
import { Star, Mail, Phone, MapPin, Award, Languages, FileText, Building2, CreditCard } from "lucide-react"
import { API_BASE_URL } from "@/lib/config"

const API_BASE = `${API_BASE_URL}/api/admin/captain`

interface Captain {
  _id: string
  name: string
  email: string
  phone: string
  address?: string
  location?: string
  experience?: number
  specialization: string[]
  languages: string[]
  rating?: number
  photos: string[]
  profileImage?: string
  backgroundImage?: string
  documents: string[]
  bio?: string
  status: 'active' | 'inactive' | 'on-leave'
  price?: number
  badge?: string
  badgeColor?: string
  bankDetails?: {
    accountHolderName?: string
    accountNumber?: string
    ifscCode?: string
    bankName?: string
    branchName?: string
    accountType?: string
    upiId?: string
  }
  createdAt: string
}

export function CaptainViewTab() {
  const params = useParams()
  const captainId = params?.id as string
  const { toast } = useToast()
  const [captain, setCaptain] = useState<Captain | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (captainId) {
      fetchCaptain()
    }
  }, [captainId])

  const fetchCaptain = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${API_BASE}/${captainId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      
      if (data.status && data.data) {
        setCaptain(data.data)
      } else {
        throw new Error(data.message || "Failed to fetch captain")
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      inactive: "secondary",
      'on-leave': "outline"
    }
    return (
      <Badge variant={variants[status] || "default"}>
        {status === 'on-leave' ? 'On Leave' : status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  if (loading) {
    return <div className="text-center py-8">Loading captain details...</div>
  }

  if (!captain) {
    return <div className="text-center py-8 text-muted-foreground">Captain not found</div>
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <div className="grid gap-4">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {captain.profileImage && (
                  <div className="flex justify-center mb-4">
                    <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200">
                      <img 
                        src={captain.profileImage} 
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error("Profile image failed to load:", captain.profileImage);
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                    <p className="text-sm font-medium">{captain.name}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">{captain.email}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">{captain.phone}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div>{getStatusBadge(captain.status)}</div>
                  </div>
                  {captain.address && (
                    <div className="space-y-2 col-span-2">
                      <label className="text-sm font-medium text-muted-foreground">Address</label>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm">{captain.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Price & Badge */}
            {(captain.price !== undefined && captain.price !== null) || captain.badge ? (
              <Card>
                <CardHeader>
                  <CardTitle>Pricing & Badge</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {captain.price !== undefined && captain.price !== null && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Price per Day</label>
                        <p className="text-sm font-medium">₹{captain.price}/day</p>
                      </div>
                    )}
                    {captain.badge && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Badge</label>
                        <Badge variant="outline">{captain.badge}</Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {/* Experience & Rating */}
            <Card>
              <CardHeader>
                <CardTitle>Experience & Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {captain.experience !== undefined && captain.experience !== null ? (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Experience</label>
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm">{captain.experience} years</p>
                      </div>
                    </div>
                  ) : null}
                  {captain.rating !== undefined && captain.rating !== null ? (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Rating</label>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <p className="text-sm">{captain.rating.toFixed(1)}</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            {/* Specialization */}
            {captain.specialization && captain.specialization.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Specialization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {captain.specialization.map((spec, index) => (
                      <Badge key={index} variant="outline">{spec}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Languages */}
            {captain.languages && captain.languages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Languages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Languages className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-wrap gap-2">
                      {captain.languages.map((lang, index) => (
                        <Badge key={index} variant="secondary">{lang}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bio */}
            {captain.bio && (
              <Card>
                <CardHeader>
                  <CardTitle>Bio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground mt-1" />
                    <p className="text-sm whitespace-pre-wrap">{captain.bio}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Profile Image */}
            {(captain.profileImage || (captain.photos && captain.photos.length > 0)) && (
              <Card>
                <CardHeader>
                  <CardTitle>Profile Image</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
                    <img 
                      src={captain.profileImage || captain.photos[0]} 
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error("Profile image failed to load:", captain.profileImage || captain.photos[0]);
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/128?text=No+Image';
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Background Image */}
            {captain.backgroundImage && (
              <Card>
                <CardHeader>
                  <CardTitle>Background Image</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                    <img 
                      src={captain.backgroundImage} 
                      alt="Background"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Photos */}
            {captain.photos && captain.photos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Photos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {captain.photos.map((photo, index) => (
                      <div key={index} className="relative aspect-video rounded-lg overflow-hidden border">
                        <img 
                          src={photo} 
                          alt={`Captain photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Documents */}
            {captain.documents && captain.documents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {captain.documents.map((doc, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <a 
                          href={doc} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Document {index + 1}
                        </a>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bank Details */}
            {captain.bankDetails && (
              <Card>
                <CardHeader>
                  <CardTitle>Bank Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {captain.bankDetails.accountHolderName && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Account Holder Name</label>
                        <p className="text-sm">{captain.bankDetails.accountHolderName}</p>
                      </div>
                    )}
                    {captain.bankDetails.accountNumber && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Account Number</label>
                        <p className="text-sm font-mono">{captain.bankDetails.accountNumber}</p>
                      </div>
                    )}
                    {captain.bankDetails.ifscCode && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">IFSC Code</label>
                        <p className="text-sm font-mono">{captain.bankDetails.ifscCode}</p>
                      </div>
                    )}
                    {captain.bankDetails.bankName && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Bank Name</label>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm">{captain.bankDetails.bankName}</p>
                        </div>
                      </div>
                    )}
                    {captain.bankDetails.branchName && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Branch Name</label>
                        <p className="text-sm">{captain.bankDetails.branchName}</p>
                      </div>
                    )}
                    {captain.bankDetails.accountType && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Account Type</label>
                        <p className="text-sm capitalize">{captain.bankDetails.accountType}</p>
                      </div>
                    )}
                    {captain.bankDetails.upiId && (
                      <div className="space-y-2 col-span-2">
                        <label className="text-sm font-medium text-muted-foreground">UPI ID</label>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm font-mono">{captain.bankDetails.upiId}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="availability" className="mt-4">
          <CaptainAvailabilityTab captainId={captainId} />
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <CaptainPaymentTab captainId={captainId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

