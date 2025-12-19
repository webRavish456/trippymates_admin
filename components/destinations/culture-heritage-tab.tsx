"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Edit, Trash2, Eye, MapPin } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Star, Activity, Calendar } from "lucide-react"


interface Destination {
  _id: string
  title?: string
  name?: string
  description?: string
  desc?: string
  location?: string
  images?: string[]
  image?: string
  type: string
  status: "active" | "inactive"
  createdAt: string
  placesDetails?: any[]
}

import { API_BASE_URL } from "@/lib/config"

const API_BASE = `${API_BASE_URL}/api/admin/destination`

export function CultureHeritageTab() {
  const router = useRouter()
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
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
      const response = await fetch(`${API_BASE}/culture?${params}`)
      const result = await response.json()

      if (result.status || result.success) {
        setDestinations(result.data || [])
      }
    } catch (error) {
      console.error("Fetch error:", error)
      toast({
        title: "Error",
        description: "Failed to fetch culture & heritage destinations",
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
          description: "Culture & Heritage destination deleted successfully",
        })
        setIsDeleteDialogOpen(false)
        setSelectedDestination(null)
        fetchDestinations()
      } else {
        throw new Error(result.message || "Failed to delete culture & heritage destination")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete culture & heritage destination",
        variant: "destructive",
      })
    }
  }

  const openDetailsDialog = async (destination: Destination) => {
    try {
      const response = await fetch(`${API_BASE}/${destination._id}`)
      const result = await response.json()
      if (result.status || result.success) {
        setSelectedDestination(result.data)
        setIsDetailsDialogOpen(true)
      }
    } catch (error) {
      console.error("Fetch error:", error)
      toast({
        title: "Error",
        description: "Failed to fetch destination details",
        variant: "destructive",
      })
    }
  }

  const filteredDestinations = destinations.filter((dest) =>
    (dest.title || dest.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (dest.description || dest.desc || "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Culture & Heritage</h2>
          <p className="text-sm text-muted-foreground">Manage culture and heritage destinations</p>
        </div>
        <Button onClick={() => router.push("/admin/explore-destination/culture/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Add Culture & Heritage
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search culture & heritage destinations..."
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
          <CardContent className="py-8 text-center text-muted-foreground">
            Loading culture & heritage destinations...
          </CardContent>
        </Card>
      ) : filteredDestinations.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No culture & heritage destinations found. Create your first destination!
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead className="w-[150px]">Title</TableHead>
                <TableHead className="w-[250px]">Description</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="text-right w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDestinations.map((destination) => (
                <TableRow key={destination._id}>
                  <TableCell>
                    {(destination.images && destination.images.length > 0) || destination.image ? (
                      <img
                        src={destination.images?.[0] || destination.image}
                        alt={destination.title || destination.name}
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                        <MapPin className="h-4 w-4" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{destination.title || destination.name || "N/A"}</TableCell>
                  <TableCell>
                    <div className="max-w-[250px] truncate" title={destination.desc || destination.description || "N/A"}>
                      {destination.desc || destination.description || "N/A"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={destination.status === "active" ? "default" : "secondary"}>
                      {destination.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDetailsDialog(destination)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/admin/explore-destination/culture/${destination._id}`)}
                      >
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
            <DialogTitle>{selectedDestination?.title || selectedDestination?.name}</DialogTitle>
          </DialogHeader>
          {selectedDestination && (
            <div className="space-y-6">
              {/* Main Image */}
              {(selectedDestination.images && selectedDestination.images.length > 0) || selectedDestination.image ? (
                <div>
                  <img
                    src={selectedDestination.images?.[0] || selectedDestination.image}
                    alt={selectedDestination.title || selectedDestination.name || "Destination"}
                    className="w-full h-64 rounded-lg object-cover"
                  />
                </div>
              ) : null}
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-sm text-muted-foreground">{selectedDestination.description || selectedDestination.desc}</p>
              </div>
              {selectedDestination.location && (
                <div>
                  <h3 className="font-semibold mb-2">Location</h3>
                  <p className="text-sm text-muted-foreground">{selectedDestination.location}</p>
                </div>
              )}
              {selectedDestination.placesDetails && selectedDestination.placesDetails.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-4">Place Details</h3>
                  <Tabs defaultValue="0" className="w-full">
                    <TabsList className="flex w-fit flex-wrap gap-2 ">
                      {selectedDestination.placesDetails.map((place: any, index: number) => (
                        <TabsTrigger key={index} value={String(index)} className="whitespace-nowrap">
                          {place.placeName || `Place ${index + 1}`}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {selectedDestination.placesDetails.map((place: any, index: number) => (
                      <TabsContent key={index} value={String(index)} className="mt-4">
                        <div className="border rounded-lg p-6 space-y-6">
                          <div>
                            <h4 className="text-xl font-bold mb-2">{place.placeName}</h4>
                            {place.images && place.images.length > 0 && (
                              <div className="grid grid-cols-2 gap-2 mb-4">
                                {place.images.slice(0, 2).map((image: string, imgIdx: number) => (
                                  <img
                                    key={imgIdx}
                                    src={image}
                                    alt={`${place.placeName} ${imgIdx + 1}`}
                                    className="h-48 w-full rounded object-cover"
                                  />
                                ))}
                              </div>
                            )}
                          </div>

                          {place.weatherInfo && (
                            <div>
                              <h5 className="font-semibold mb-2">Weather Information</h5>
                              <p className="text-sm text-muted-foreground">{place.weatherInfo}</p>
                            </div>
                          )}

                          {place.topAttractions && place.topAttractions.length > 0 && (
                            <div>
                              <h5 className="font-semibold mb-3">Top Attractions</h5>
                              <Carousel className="w-full">
                                <CarouselContent className="-ml-2 md:-ml-4">
                                  {place.topAttractions.map((attraction: any, i: number) => (
                                    <CarouselItem key={i} className="pl-2 md:pl-4 md:basis-1/2">
                                      <Card>
                                        <CardContent className="pt-4">
                                          {attraction.image && (
                                            <img
                                              src={attraction.image}
                                              alt={attraction.name}
                                              className="h-64 w-full rounded object-cover mb-4"
                                            />
                                          )}
                                          <h6 className="font-semibold mb-2 text-lg">{attraction.name}</h6>
                                          {attraction.description && (
                                            <p className="text-sm text-muted-foreground">{attraction.description}</p>
                                          )}
                                        </CardContent>
                                      </Card>
                                    </CarouselItem>
                                  ))}
                                </CarouselContent>
                                {place.topAttractions.length > 1 && (
                                  <>
                                    <CarouselPrevious className="left-2" />
                                    <CarouselNext className="right-2" />
                                  </>
                                )}
                              </Carousel>
                            </div>
                          )}

                          {place.food && place.food.length > 0 && (
                            <div>
                              <h5 className="font-semibold mb-3">Food & Local Cuisine</h5>
                              <Carousel className="w-full">
                                <CarouselContent className="-ml-2 md:-ml-4">
                                  {place.food.map((food: any, i: number) => (
                                    <CarouselItem key={i} className="pl-2 md:pl-4 md:basis-1/2">
                                      <Card>
                                        <CardContent className="pt-4">
                                          {food.image && (
                                            <img
                                              src={food.image}
                                              alt={food.name}
                                              className="h-64 w-full rounded object-cover mb-4"
                                            />
                                          )}
                                          <div className="flex items-center gap-2 mb-2">
                                            <h6 className="font-semibold text-lg">{food.name}</h6>
                                            {food.type && <Badge variant="outline">{food.type}</Badge>}
                                          </div>
                                          {food.description && (
                                            <p className="text-sm text-muted-foreground">{food.description}</p>
                                          )}
                                        </CardContent>
                                      </Card>
                                    </CarouselItem>
                                  ))}
                                </CarouselContent>
                                {place.food.length > 1 && (
                                  <>
                                    <CarouselPrevious className="left-2" />
                                    <CarouselNext className="right-2" />
                                  </>
                                )}
                              </Carousel>
                            </div>
                          )}

                          {place.hotels && place.hotels.length > 0 && (
                            <div>
                              <h5 className="font-semibold mb-3">Hotels</h5>
                              <Carousel className="w-full">
                                <CarouselContent className="-ml-2 md:-ml-4">
                                  {place.hotels.map((hotel: any, i: number) => (
                                    <CarouselItem key={i} className="pl-2 md:pl-4 md:basis-1/2">
                                      <Card>
                                        <CardContent className="pt-4">
                                          {hotel.image && (
                                            <img
                                              src={hotel.image}
                                              alt={hotel.name}
                                              className="h-64 w-full rounded object-cover mb-4"
                                            />
                                          )}
                                          <div className="flex items-center gap-2 mb-2">
                                            <h6 className="font-semibold text-lg">{hotel.name}</h6>
                                            {hotel.rating && (
                                              <div className="flex items-center gap-1">
                                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                <span className="text-sm">{hotel.rating}</span>
                                              </div>
                                            )}
                                          </div>
                                          {hotel.location && (
                                            <p className="text-sm text-muted-foreground mb-2">📍 {hotel.location}</p>
                                          )}
                                          {hotel.priceRange && (
                                            <p className="text-sm font-medium mb-2">{hotel.priceRange}</p>
                                          )}
                                          {hotel.description && (
                                            <p className="text-sm text-muted-foreground">{hotel.description}</p>
                                          )}
                                        </CardContent>
                                      </Card>
                                    </CarouselItem>
                                  ))}
                                </CarouselContent>
                                {place.hotels.length > 1 && (
                                  <>
                                    <CarouselPrevious className="left-2" />
                                    <CarouselNext className="right-2" />
                                  </>
                                )}
                              </Carousel>
                            </div>
                          )}

                          {place.activities && place.activities.length > 0 && (
                            <div>
                              <h5 className="font-semibold mb-3">Activities & Experiences</h5>
                              <Carousel className="w-full">
                                <CarouselContent className="-ml-2 md:-ml-4">
                                  {place.activities.map((activity: any, i: number) => (
                                    <CarouselItem key={i} className="pl-2 md:pl-4 md:basis-1/2">
                                      <Card>
                                        <CardContent className="pt-4">
                                          {activity.image && (
                                            <img
                                              src={activity.image}
                                              alt={activity.name}
                                              className="h-64 w-full rounded object-cover mb-4"
                                            />
                                          )}
                                          <div className="flex items-center gap-2 mb-2">
                                            <Activity className="h-4 w-4" />
                                            <h6 className="font-semibold text-lg">{activity.name}</h6>
                                            {activity.type && <Badge variant="outline">{activity.type}</Badge>}
                                          </div>
                                          <div className="flex gap-4 text-sm text-muted-foreground mb-2">
                                            {activity.duration && <span>⏱️ {activity.duration}</span>}
                                            {activity.priceRange && <span>💰 {activity.priceRange}</span>}
                                          </div>
                                          {activity.location && (
                                            <p className="text-sm text-muted-foreground mb-2">📍 {activity.location}</p>
                                          )}
                                          {activity.description && (
                                            <p className="text-sm text-muted-foreground">{activity.description}</p>
                                          )}
                                        </CardContent>
                                      </Card>
                                    </CarouselItem>
                                  ))}
                                </CarouselContent>
                                {place.activities.length > 1 && (
                                  <>
                                    <CarouselPrevious className="left-2" />
                                    <CarouselNext className="right-2" />
                                  </>
                                )}
                              </Carousel>
                            </div>
                          )}

                          {place.eventsFestivals && place.eventsFestivals.length > 0 && (
                            <div>
                              <h5 className="font-semibold mb-3">Events & Festivals</h5>
                              <Carousel className="w-full">
                                <CarouselContent className="-ml-2 md:-ml-4">
                                  {place.eventsFestivals.map((event: any, i: number) => (
                                    <CarouselItem key={i} className="pl-2 md:pl-4 md:basis-1/2">
                                      <Card>
                                        <CardContent className="pt-4">
                                          {event.image && (
                                            <img
                                              src={event.image}
                                              alt={event.name}
                                              className="h-64 w-full rounded object-cover mb-4"
                                            />
                                          )}
                                          <div className="flex items-center gap-2 mb-2">
                                            <Calendar className="h-4 w-4" />
                                            <h6 className="font-semibold text-lg">{event.name}</h6>
                                            {event.type && <Badge variant="outline">{event.type}</Badge>}
                                          </div>
                                          <div className="flex gap-4 text-sm text-muted-foreground mb-2">
                                            {event.month && <span>📅 {event.month}</span>}
                                            {event.date && <span>{event.date}</span>}
                                          </div>
                                          {event.location && (
                                            <p className="text-sm text-muted-foreground mb-2">📍 {event.location}</p>
                                          )}
                                          {event.description && (
                                            <p className="text-sm text-muted-foreground">{event.description}</p>
                                          )}
                                        </CardContent>
                                      </Card>
                                    </CarouselItem>
                                  ))}
                                </CarouselContent>
                                {place.eventsFestivals.length > 1 && (
                                  <>
                                    <CarouselPrevious className="left-2" />
                                    <CarouselNext className="right-2" />
                                  </>
                                )}
                              </Carousel>
                            </div>
                          )}

                          {place.nearbyDestinations && place.nearbyDestinations.length > 0 && (
                            <div>
                              <h5 className="font-semibold mb-3">Nearby Destinations</h5>
                              <Carousel className="w-full">
                                <CarouselContent className="-ml-2 md:-ml-4">
                                  {place.nearbyDestinations.map((nearby: any, i: number) => (
                                    <CarouselItem key={i} className="pl-2 md:pl-4 md:basis-1/2">
                                      <Card>
                                        <CardContent className="pt-4">
                                          {nearby.image && (
                                            <img
                                              src={nearby.image}
                                              alt={nearby.name}
                                              className="h-64 w-full rounded object-cover mb-4"
                                            />
                                          )}
                                          <div className="flex items-center gap-2 mb-2">
                                            <h6 className="font-semibold text-lg">{nearby.name}</h6>
                                            {nearby.distance && <Badge variant="outline">{nearby.distance}</Badge>}
                                          </div>
                                          {nearby.description && (
                                            <p className="text-sm text-muted-foreground">{nearby.description}</p>
                                          )}
                                        </CardContent>
                                      </Card>
                                    </CarouselItem>
                                  ))}
                                </CarouselContent>
                                {place.nearbyDestinations.length > 1 && (
                                  <>
                                    <CarouselPrevious className="left-2" />
                                    <CarouselNext className="right-2" />
                                  </>
                                )}
                              </Carousel>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
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
              This action cannot be undone. This will permanently delete the culture & heritage destination.
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
