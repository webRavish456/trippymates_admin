"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Edit, Trash2, Eye, MapPin } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Star, Utensils, Hotel, MapPinned, Activity, Calendar } from "lucide-react"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"

interface TopAttraction {
  name: string
  image: string
  description: string
}

interface Hotel {
  name: string
  description: string
  image: string
  rating?: number
  priceRange?: string
  location?: string
}

interface FoodItem {
  name: string
  description: string
  image: string
  type?: string
}

interface NearbyDestination {
  name: string
  distance: string
  description: string
  image: string
}

interface Activity {
  name: string
  type?: string
  description?: string
  image?: string
  duration?: string
  priceRange?: string
  location?: string
}

interface EventFestival {
  name: string
  type?: string
  description?: string
  image?: string
  month?: string
  date?: string
  location?: string
}

interface Destination {
  _id: string
  name: string
  description: string
  location: string
  images: string[]
  bestTimeToVisit?: string
  attractions?: string[]
  status: "active" | "inactive"
  createdAt: string
  weatherInfo?: string
  duration?: string
  topAttractions?: TopAttraction[]
  hotels?: Hotel[]
  foodAndCuisine?: FoodItem[]
  nearbyDestinations?: NearbyDestination[]
  activities?: Activity[]
  eventsFestivals?: EventFestival[]
}

import { API_BASE_URL } from "@/lib/config"

const API_BASE = `${API_BASE_URL}/api/admin/destination`

export function PopularDestinationTab() {
  const router = useRouter()
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchDestinations()
  }, [searchQuery])

  const fetchDestinations = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        ...(searchQuery && { search: searchQuery }),
      })
      const response = await fetch(`${API_BASE}/popular?${params}`)
      const result = await response.json()

      if (result.status || result.success) {
        setDestinations(result.data || [])
      }
    } catch (error) {
      console.error("Fetch error:", error)
      toast({
        title: "Error",
        description: "Failed to fetch destinations",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDestination = async () => {
    if (!selectedDestination) return

    try {
      const response = await fetch(`${API_BASE}/delete/${selectedDestination._id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.status || result.success) {
        toast({
          title: "Success",
          description: "Destination deleted successfully",
        })
        setIsDeleteDialogOpen(false)
        setSelectedDestination(null)
        fetchDestinations()
      } else {
        throw new Error(result.message || "Failed to delete destination")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete destination",
        variant: "destructive",
      })
    }
  }

  const openDetailsDialog = (destination: Destination) => {
    setSelectedDestination(destination)
    setIsDetailsDialogOpen(true)
  }

  const filteredDestinations = destinations.filter(
    (dest) =>
      dest.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dest.location?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Popular Destinations</h2>
          <p className="text-sm text-muted-foreground">Manage popular travel destinations with detailed information</p>
        </div>
        <Button onClick={() => router.push("/admin/explore-destination/popular/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Add Destination
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search destinations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">Loading destinations...</CardContent>
        </Card>
      ) : filteredDestinations.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No destinations found. Create your first destination!
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Best Time</TableHead>
                <TableHead>Weather</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDestinations.map((destination) => (
                <TableRow key={destination._id}>
                  <TableCell>
                    {destination.images && destination.images.length > 0 ? (
                      <img
                        src={destination.images[0]}
                        alt={destination.name}
                        className="h-12 w-12 rounded object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                        <MapPin className="h-4 w-4" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{destination.name}</TableCell>
                  <TableCell>{destination.location}</TableCell>
                  <TableCell>
                    {destination.bestTimeToVisit ? (
                      <span title={destination.bestTimeToVisit}>
                        {destination.bestTimeToVisit.length > 50 
                          ? `${destination.bestTimeToVisit.substring(0, 50)}...` 
                          : destination.bestTimeToVisit}
                      </span>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  <TableCell>
                    {destination.weatherInfo ? (
                      <span className="text-sm text-muted-foreground" title={destination.weatherInfo}>
                        {destination.weatherInfo.length > 30 
                          ? `${destination.weatherInfo.substring(0, 30)}...` 
                          : destination.weatherInfo}
                      </span>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={destination.status === "active" ? "default" : "secondary"}>
                      {destination.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openDetailsDialog(destination)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => router.push(`/admin/explore-destination/popular/${destination._id}`)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedDestination(destination)
                          setIsDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Details View Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-[900px] sm:max-w-[900px] md:max-w-[900px] lg:max-w-[900px] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedDestination?.name}</DialogTitle>
          </DialogHeader>
          {selectedDestination && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Location</h3>
                <p className="text-sm text-muted-foreground">{selectedDestination.location}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-sm text-muted-foreground">{selectedDestination.description}</p>
              </div>
              {selectedDestination.weatherInfo && (
                <div>
                  <h3 className="font-semibold mb-2">Weather Information</h3>
                  <p className="text-sm text-muted-foreground">{selectedDestination.weatherInfo}</p>
                </div>
              )}
              {selectedDestination.topAttractions && selectedDestination.topAttractions.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Top Attractions</h3>
                  <Carousel className="w-full">
                    <CarouselContent className="-ml-2 md:-ml-4">
                      {selectedDestination.topAttractions.map((attraction, index) => (
                        <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2">
                          <Card>
                            <CardContent className="pt-4">
                              {attraction.image && (
                                <img src={attraction.image} alt={attraction.name} className="h-64 w-full rounded object-cover mb-4" />
                              )}
                              <h4 className="font-semibold mb-2 text-lg">{attraction.name}</h4>
                              <p className="text-sm text-muted-foreground">{attraction.description}</p>
                            </CardContent>
                          </Card>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    {selectedDestination.topAttractions.length > 1 && (
                      <>
                        <CarouselPrevious className="left-2" />
                        <CarouselNext className="right-2" />
                      </>
                    )}
                  </Carousel>
                </div>
              )}
              {selectedDestination.hotels && selectedDestination.hotels.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Hotels</h3>
                  <Carousel className="w-full">
                    <CarouselContent className="-ml-2 md:-ml-4">
                      {selectedDestination.hotels.map((hotel, index) => (
                        <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2">
                          <Card>
                            <CardContent className="pt-4">
                              {hotel.image && (
                                <img src={hotel.image} alt={hotel.name} className="h-64 w-full rounded object-cover mb-4" />
                              )}
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-lg">{hotel.name}</h4>
                                {hotel.rating && (
                                  <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    <span className="text-sm">{hotel.rating}</span>
                                  </div>
                                )}
                              </div>
                              {hotel.location && <p className="text-sm text-muted-foreground mb-2">📍 {hotel.location}</p>}
                              {hotel.priceRange && <p className="text-sm font-medium mb-2">{hotel.priceRange}</p>}
                              <p className="text-sm text-muted-foreground">{hotel.description}</p>
                            </CardContent>
                          </Card>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    {selectedDestination.hotels.length > 1 && (
                      <>
                        <CarouselPrevious className="left-2" />
                        <CarouselNext className="right-2" />
                      </>
                    )}
                  </Carousel>
                </div>
              )}
              {selectedDestination.foodAndCuisine && selectedDestination.foodAndCuisine.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Food & Local Cuisine</h3>
                  <Carousel className="w-full">
                    <CarouselContent className="-ml-2 md:-ml-4">
                      {selectedDestination.foodAndCuisine.map((food, index) => (
                        <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2">
                          <Card>
                            <CardContent className="pt-4">
                              {food.image && (
                                <img src={food.image} alt={food.name} className="h-64 w-full rounded object-cover mb-4" />
                              )}
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-lg">{food.name}</h4>
                                {food.type && <Badge variant="outline">{food.type}</Badge>}
                              </div>
                              <p className="text-sm text-muted-foreground">{food.description}</p>
                            </CardContent>
                          </Card>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    {selectedDestination.foodAndCuisine.length > 1 && (
                      <>
                        <CarouselPrevious className="left-2" />
                        <CarouselNext className="right-2" />
                      </>
                    )}
                  </Carousel>
                </div>
              )}
              {selectedDestination.nearbyDestinations && selectedDestination.nearbyDestinations.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Nearby Destinations</h3>
                  <Carousel className="w-full">
                    <CarouselContent className="-ml-2 md:-ml-4">
                      {selectedDestination.nearbyDestinations.map((nearby, index) => (
                        <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2">
                          <Card>
                            <CardContent className="pt-4">
                              {nearby.image && (
                                <img src={nearby.image} alt={nearby.name} className="h-64 w-full rounded object-cover mb-4" />
                              )}
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-lg">{nearby.name}</h4>
                                {nearby.distance && <Badge variant="outline">{nearby.distance}</Badge>}
                              </div>
                              <p className="text-sm text-muted-foreground">{nearby.description}</p>
                            </CardContent>
                          </Card>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    {selectedDestination.nearbyDestinations.length > 1 && (
                      <>
                        <CarouselPrevious className="left-2" />
                        <CarouselNext className="right-2" />
                      </>
                    )}
                  </Carousel>
                </div>
              )}
              {selectedDestination.activities && selectedDestination.activities.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Activities & Experiences</h3>
                  <Carousel className="w-full">
                    <CarouselContent className="-ml-2 md:-ml-4">
                      {selectedDestination.activities.map((activity, index) => (
                        <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2">
                          <Card>
                            <CardContent className="pt-4">
                              {activity.image && (
                                <img src={activity.image} alt={activity.name} className="h-64 w-full rounded object-cover mb-4" />
                              )}
                              <div className="flex items-center gap-2 mb-2">
                                <Activity className="h-4 w-4" />
                                <h4 className="font-semibold text-lg">{activity.name}</h4>
                                {activity.type && <Badge variant="outline">{activity.type}</Badge>}
                              </div>
                              <div className="flex gap-4 text-sm text-muted-foreground mb-2">
                                {activity.duration && <span>⏱️ {activity.duration}</span>}
                                {activity.priceRange && <span>💰 {activity.priceRange}</span>}
                              </div>
                              {activity.location && <p className="text-sm text-muted-foreground mb-2">📍 {activity.location}</p>}
                              <p className="text-sm text-muted-foreground">{activity.description}</p>
                            </CardContent>
                          </Card>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    {selectedDestination.activities.length > 1 && (
                      <>
                        <CarouselPrevious className="left-2" />
                        <CarouselNext className="right-2" />
                      </>
                    )}
                  </Carousel>
                </div>
              )}
              {selectedDestination.eventsFestivals && selectedDestination.eventsFestivals.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Events & Festivals</h3>
                  <Carousel className="w-full">
                    <CarouselContent className="-ml-2 md:-ml-4">
                      {selectedDestination.eventsFestivals.map((event, index) => (
                        <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2">
                          <Card>
                            <CardContent className="pt-4">
                              {event.image && (
                                <img src={event.image} alt={event.name} className="h-64 w-full rounded object-cover mb-4" />
                              )}
                              <div className="flex items-center gap-2 mb-2">
                                <Calendar className="h-4 w-4" />
                                <h4 className="font-semibold text-lg">{event.name}</h4>
                                {event.type && <Badge variant="outline">{event.type}</Badge>}
                              </div>
                              <div className="flex gap-4 text-sm text-muted-foreground mb-2">
                                {event.month && <span>📅 {event.month}</span>}
                                {event.date && <span>{event.date}</span>}
                              </div>
                              {event.location && <p className="text-sm text-muted-foreground mb-2">📍 {event.location}</p>}
                              <p className="text-sm text-muted-foreground">{event.description}</p>
                            </CardContent>
                          </Card>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    {selectedDestination.eventsFestivals.length > 1 && (
                      <>
                        <CarouselPrevious className="left-2" />
                        <CarouselNext className="right-2" />
                      </>
                    )}
                  </Carousel>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the destination "{selectedDestination?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDestination} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
