"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Save, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { API_BASE_URL } from "@/lib/config"
import { EditPageSkeleton } from "@/components/ui/skeletons"

const API_BASE = `${API_BASE_URL}/api/admin/promo-code`

export default function EditPromoCodePage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState({
    code: "",
    title: "",
    description: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: 0,
    minBookingAmount: 0,
    maxDiscountAmount: 0,
    validFrom: "",
    validUntil: "",
    userLimit: 1,
    oneTimeUseOnly: false,
    status: "active" as "active" | "inactive"
  })

  useEffect(() => {
    if (params.id) {
      fetchPromoCode()
    }
  }, [params.id])

  const fetchPromoCode = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (data.status && data.data) {
        const promoCode = data.data
        // Format dates for input fields (YYYY-MM-DD)
        const formatDate = (date: string | Date) => {
          if (!date) return ""
          const d = new Date(date)
          return d.toISOString().split('T')[0]
        }

        setFormData({
          code: promoCode.code || "",
          title: promoCode.title || "",
          description: promoCode.description || "",
          discountType: promoCode.discountType || "percentage",
          discountValue: promoCode.discountValue || 0,
          minBookingAmount: promoCode.minBookingAmount || 0,
          maxDiscountAmount: promoCode.maxDiscountAmount || 0,
          validFrom: formatDate(promoCode.validFrom),
          validUntil: formatDate(promoCode.validUntil),
          userLimit: promoCode.userLimit || 1,
          oneTimeUseOnly: promoCode.userLimit === 1,
          status: promoCode.status || "active"
        })
      } else {
        throw new Error(data.message || "Failed to fetch promo code")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load promo code",
        variant: "destructive",
      })
      router.push('/admin/promo-code/details')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token')
      const payload = {
        ...formData,
        maxDiscountAmount: formData.maxDiscountAmount || null,
        userLimit: formData.oneTimeUseOnly ? 1 : null
      }
      // Remove oneTimeUseOnly from payload as it's not needed in backend
      delete payload.oneTimeUseOnly

      const response = await fetch(`${API_BASE}/update/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (data.status) {
        toast({
          title: "Success",
          description: "Promo code updated successfully",
        })
        router.push('/admin/promo-code/details')
      } else {
        throw new Error(data.message || "Failed to update promo code")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update promo code",
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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Promo Code</h1>
          <p className="text-sm text-muted-foreground">Update promo code information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Promo Code Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Promo Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="PROMO2024"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Special Promo"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Promo code description..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discountType">Discount Type *</Label>
                <Select
                  value={formData.discountType}
                  onValueChange={(value: "percentage" | "fixed") => setFormData({ ...formData, discountType: value })}
                >
                  <SelectTrigger className="w-full min-w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountValue">Discount Value *</Label>
                <Input
                  id="discountValue"
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                  placeholder={formData.discountType === 'percentage' ? "15" : "1000"}
                  required
                  min="0"
                />
              </div>
            </div>

            {formData.discountType === 'percentage' && (
              <div className="space-y-2">
                <Label htmlFor="maxDiscountAmount">Max Discount Amount (Optional)</Label>
                <Input
                  id="maxDiscountAmount"
                  type="number"
                  value={formData.maxDiscountAmount === 0 ? '' : formData.maxDiscountAmount}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                    setFormData({ ...formData, maxDiscountAmount: value });
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '') {
                      setFormData({ ...formData, maxDiscountAmount: 0 });
                    }
                  }}
                  placeholder="2000"
                  min="0"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minBookingAmount">Minimum Booking Amount</Label>
                <Input
                  id="minBookingAmount"
                  type="number"
                  value={formData.minBookingAmount === 0 ? '' : formData.minBookingAmount}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                    setFormData({ ...formData, minBookingAmount: value });
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '') {
                      setFormData({ ...formData, minBookingAmount: 0 });
                    }
                  }}
                  placeholder="0"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="oneTimeUseOnly"
                    checked={formData.oneTimeUseOnly}
                    onCheckedChange={(checked) => {
                      setFormData({ 
                        ...formData, 
                        oneTimeUseOnly: checked
                      })
                    }}
                  />
                  <Label htmlFor="oneTimeUseOnly" className="cursor-pointer">
                    One Time User Only
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground ml-11">
                  {formData.oneTimeUseOnly ? "User can use this promo code only once" : "User can use this promo code multiple times until expiry"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="validFrom">Valid From *</Label>
                <Input
                  id="validFrom"
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validUntil">Valid Until *</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="flex gap-4 justify-end">
              <Button type="button" variant="outline" onClick={() => router.push('/admin/promo-code/details')}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Updating...' : 'Update Promo Code'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
