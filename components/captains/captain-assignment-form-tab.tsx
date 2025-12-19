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
import { API_BASE_URL } from "@/lib/config"

const API_BASE = `${API_BASE_URL}/api/admin/captain-assignment`
const CAPTAIN_API_BASE = `${API_BASE_URL}/api/admin/captain`
const PACKAGE_API_BASE = `${API_BASE_URL}/api/admin/packages`

export function CaptainAssignmentFormTab() {
  const router = useRouter()
  const params = useParams()
  const assignmentId = params?.id as string
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [captains, setCaptains] = useState<any[]>([])
  const [packages, setPackages] = useState<any[]>([])

  const [formData, setFormData] = useState({
    captainId: "",
    packageId: "",
    startDate: "",
    endDate: "",
    notes: "",
    status: "assigned" as "assigned" | "in-progress" | "completed" | "cancelled"
  })

  useEffect(() => {
    fetchCaptains()
    fetchPackages()
    if (assignmentId && assignmentId !== 'new') {
      fetchAssignment(assignmentId)
    }
  }, [assignmentId])

  const fetchCaptains = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${CAPTAIN_API_BASE}/all?limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.status) {
        setCaptains(data.data.captains || [])
      }
    } catch (error) {
      console.error("Failed to fetch captains:", error)
    }
  }

  const fetchPackages = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${PACKAGE_API_BASE}/showPackage?limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.status) {
        setPackages(data.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch packages:", error)
    }
  }

  const fetchAssignment = async (id: string) => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${API_BASE}/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      
      if (data.status && data.data) {
        const assignment = data.data
        setFormData({
          captainId: assignment.captainId?._id || assignment.captainId || "",
          packageId: assignment.packageId?._id || assignment.packageId || "",
          startDate: assignment.startDate ? new Date(assignment.startDate).toISOString().split('T')[0] : "",
          endDate: assignment.endDate ? new Date(assignment.endDate).toISOString().split('T')[0] : "",
          notes: assignment.notes || "",
          status: assignment.status || "assigned"
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch assignment",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const token = localStorage.getItem('adminToken')
      const url = assignmentId && assignmentId !== 'new' ? `${API_BASE}/update/${assignmentId}` : `${API_BASE}/add`
      const method = assignmentId && assignmentId !== 'new' ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.status) {
        toast({
          title: "Success",
          description: assignmentId && assignmentId !== 'new' ? "Assignment updated successfully" : "Captain assigned successfully",
        })
        router.push('/admin/captain/assignment')
      } else {
        throw new Error(data.message || "Failed to save assignment")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save assignment",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">{assignmentId && assignmentId !== 'new' ? 'Edit Assignment' : 'Assign Captain to Package'}</h2>
        <p className="text-sm text-muted-foreground">Assign captains to packages</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Assignment Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="captainId">Captain *</Label>
                <Select
                  value={formData.captainId}
                  onValueChange={(value) => setFormData({ ...formData, captainId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Captain" />
                  </SelectTrigger>
                  <SelectContent>
                    {captains.filter(captain => captain._id && captain._id.trim() !== "").map((captain) => (
                      <SelectItem key={captain._id} value={captain._id}>
                        {captain.name} - {captain.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="packageId">Package *</Label>
                <Select
                  value={formData.packageId}
                  onValueChange={(value) => setFormData({ ...formData, packageId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Package" />
                  </SelectTrigger>
                  <SelectContent>
                    {packages.filter(pkg => pkg._id && pkg._id.trim() !== "").map((pkg) => (
                      <SelectItem key={pkg._id} value={pkg._id}>
                        {pkg.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "assigned" | "in-progress" | "completed" | "cancelled") => 
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={4}
              />
            </div>

            <div className="flex gap-4 justify-end">
              <Button type="button" variant="outline" onClick={() => router.push('/admin/captain/assignment')}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Saving...' : assignmentId && assignmentId !== 'new' ? 'Update Assignment' : 'Assign Captain'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}

