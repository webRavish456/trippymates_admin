"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { API_BASE_URL } from "@/lib/config"

const API_BASE = `${API_BASE_URL}/api/admin/captain-availability`

interface Availability {
  _id: string
  date: string
  status: 'available' | 'unavailable' | 'booked'
  reason?: string
  notes?: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  bookingReference?: string
}

export function CaptainAvailabilityTab({ captainId }: { captainId: string }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [availabilities, setAvailabilities] = useState<Record<string, Availability>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (captainId) {
      fetchAvailabilities()
    }
  }, [captainId, currentDate])

  const fetchAvailabilities = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('adminToken')
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1
      
      const response = await fetch(`${API_BASE}/captain/${captainId}?year=${year}&month=${month}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      
      if (data.status && data.data) {
        const availabilityMap: Record<string, Availability> = {}
        data.data.forEach((avail: Availability) => {
          const dateKey = new Date(avail.date).toISOString().split('T')[0]
          availabilityMap[dateKey] = avail
        })
        setAvailabilities(availabilityMap)
      }
    } catch (error: any) {
      console.error("Error fetching availability:", error)
    } finally {
      setLoading(false)
    }
  }


  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }
    return days
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'unavailable':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'booked':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle2 className="h-4 w-4" />
      case 'unavailable':
        return <XCircle className="h-4 w-4" />
      case 'booked':
        return <Clock className="h-4 w-4" />
      default:
        return null
    }
  }

  const days = getDaysInMonth(currentDate)
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"]
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Availability Calendar (View Only)</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Availability is managed automatically through bookings. Bookings can only be made from the frontend.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Month Navigation */}
            <div className="flex items-center justify-between">
              <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <Button variant="outline" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Day Headers */}
              {dayNames.map((day) => (
                <div key={day} className="text-center font-medium text-sm p-2">
                  {day}
                </div>
              ))}

              {/* Calendar Days */}
              {days.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="aspect-square" />
                }

                const dateKey = date.toISOString().split('T')[0]
                const availability = availabilities[dateKey]
                const isToday = date.toDateString() === new Date().toDateString()
                const isPast = date < new Date(new Date().setHours(0, 0, 0, 0))

                return (
                  <div
                    key={dateKey}
                    className={`
                      aspect-square border rounded-lg p-2 text-sm
                      ${isPast ? 'opacity-50 bg-gray-50' : ''}
                      ${isToday ? 'ring-2 ring-primary' : ''}
                      ${availability ? getStatusColor(availability.status) : 'bg-white'}
                    `}
                  >
                    <div className="flex flex-col items-center justify-center h-full">
                      <span className={isToday ? 'font-bold' : ''}>{date.getDate()}</span>
                      {availability && (
                        <div className="mt-1">
                          {getStatusIcon(availability.status)}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex gap-4 justify-center pt-4 border-t">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm">Unavailable</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Booked</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

