"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star } from "lucide-react"

interface Testimonial {
  id: string
  customerName: string
  tripTitle: string
  rating: number
  comment: string
  date: string
  status: "approved" | "pending"
}

interface TestimonialDialogProps {
  testimonial: Testimonial | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (testimonial: Testimonial) => void
}

export function TestimonialDialog({ testimonial, open, onOpenChange, onSave }: TestimonialDialogProps) {
  const [formData, setFormData] = useState<Testimonial>({
    id: "",
    customerName: "",
    tripTitle: "",
    rating: 5,
    comment: "",
    date: new Date().toISOString().split("T")[0],
    status: "pending",
  })

  useEffect(() => {
    if (testimonial) {
      setFormData(testimonial)
    } else {
      setFormData({
        id: "",
        customerName: "",
        tripTitle: "",
        rating: 5,
        comment: "",
        date: new Date().toISOString().split("T")[0],
        status: "pending",
      })
    }
  }, [testimonial, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{testimonial ? "Edit Testimonial" : "Add New Testimonial"}</DialogTitle>
          <DialogDescription>
            {testimonial ? "Update the testimonial details below" : "Fill in the details to create a new testimonial"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tripTitle">Trip Title</Label>
              <Input
                id="tripTitle"
                value={formData.tripTitle}
                onChange={(e) => setFormData({ ...formData, tripTitle: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-6 w-6 cursor-pointer ${i < formData.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                  onClick={() => setFormData({ ...formData, rating: i + 1 })}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Comment</Label>
            <Textarea
              id="comment"
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              rows={4}
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "approved" | "pending") => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{testimonial ? "Update Testimonial" : "Create Testimonial"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
