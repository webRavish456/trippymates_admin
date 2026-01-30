"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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

const API_BASE = `${API_BASE_URL}/api/admin/coupon`

export default function CreateCouponPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

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

      const response = await fetch(`${API_BASE}/add`, {
        method: 'POST',
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
          description: "Coupon created successfully",
        })
        router.push('/admin/coupon-code/details')
      } else {
        throw new Error(data.message || "Failed to create coupon")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create coupon",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create New Coupon</h1>
          <p className="text-sm text-muted-foreground">Create a new coupon code for discounts</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Coupon Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Coupon Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="SUMMER2024"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Summer Sale"
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
                placeholder="Coupon description..."
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
                  placeholder={formData.discountType === 'percentage' ? "10" : "500"}
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
                  placeholder="1000"
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
                  {formData.oneTimeUseOnly ? "User can use this coupon only once" : "User can use this coupon multiple times until expiry"}
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
              <Button type="button" variant="outline" onClick={() => router.push('/admin/coupon-code/details')}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Creating...' : 'Create Coupon'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
