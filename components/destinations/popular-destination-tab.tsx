"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Edit, Trash2, Eye, MapPin, Star, Hotel, Activity, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { TableRowSkeleton } from "@/components/ui/skeletons"

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
import { useSelector } from "react-redux"
import { RootState } from "@/components/redux/store"

const API_BASE = `${API_BASE_URL}/api/admin/destination`

type Permission = {
  module: string;
  create: boolean;
  read?: boolean;
  update?: boolean;
  delete?: boolean;
};

type ExploreDestinationPermission = {
  create: boolean;
  update: boolean;
  delete: boolean;
};

export function PopularDestinationTab() {

  const permissions = useSelector(
    (state: RootState) => state.permission.permissions
  )
  const [hasPermission, setHasPermission] = useState<ExploreDestinationPermission>({
    create: false,
    update: false,
    delete: false,
  })  


  const router = useRouter()
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if(loading){
      fetchDestinations()
    }
    setCurrentPage(1) 
  }, [searchQuery, loading])

  useEffect(() => {
    const popularDestinationPermission = permissions.find(
      (p: Permission) => p.module === "explore_destination"
    )
    setHasPermission({
      create: popularDestinationPermission?.create ?? false,
      update: popularDestinationPermission?.update ?? false,
      delete: popularDestinationPermission?.delete ?? false,
    })
  }, [])

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
      setDestinations([])
      // Don't show toast for GET requests
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

  // Calculate pagination
  const totalPages = Math.ceil(filteredDestinations.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedDestinations = filteredDestinations.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const renderTableContent = () => {
    if (loading) {
      return (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Season</TableHead>
                <TableHead>Famous For</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRowSkeleton key={index} columns={5} />
              ))}
            </TableBody>
          </Table>
        </div>
      )
    }
    if (filteredDestinations.length === 0) {
      return (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No destinations found. Create your first destination!
          </CardContent>
        </Card>
      )
    }
    return (
      <Card>
        <CardContent className="pt-6">
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
                {paginatedDestinations.map((destination) => (
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
                    {(() => {
                      if (!destination.bestTimeToVisit) return "N/A"
                      const truncated = destination.bestTimeToVisit.length > 50 
                        ? `${destination.bestTimeToVisit.substring(0, 50)}...` 
                        : destination.bestTimeToVisit
                      return <span title={destination.bestTimeToVisit}>{truncated}</span>
                    })()}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      if (!destination.weatherInfo) return "N/A"
                      const truncated = destination.weatherInfo.length > 30 
                        ? `${destination.weatherInfo.substring(0, 30)}...` 
                        : destination.weatherInfo
                      return <span className="text-sm text-muted-foreground" title={destination.weatherInfo}>{truncated}</span>
                    })()}
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
                      {hasPermission.update && <Button variant="ghost" size="icon" onClick={() => router.push(`/admin/explore-destination/popular/${destination._id}`)}>
                        <Edit className="h-4 w-4" />
                      </Button>}
                      {hasPermission.delete && <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedDestination(destination)
                          setIsDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>}
                    </div>
                  </TableCell>
                </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6 pb-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(currentPage - 1)}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => handlePageChange(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <PaginationItem key={page}>
                            <span className="px-3 py-2">...</span>
                          </PaginationItem>
                        )
                      }
                      return null
                    })}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => handlePageChange(currentPage + 1)}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Popular Destinations</h2>
          <p className="text-sm text-muted-foreground">Manage popular travel destinations with detailed information</p>
        </div>
        {hasPermission.create && <Button onClick={() => router.push("/admin/explore-destination/popular/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Add Destination
        </Button>}
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

      {renderTableContent()}

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
                        <CarouselItem key={`attraction-${attraction.name || 'item'}-${index}`} className="pl-2 md:pl-4 md:basis-1/2">
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
                        <CarouselItem key={`hotel-${hotel.name || 'item'}-${index}`} className="pl-2 md:pl-4 md:basis-1/2">
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
                        <CarouselItem key={`food-${food.name || 'item'}-${index}`} className="pl-2 md:pl-4 md:basis-1/2">
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
                        <CarouselItem key={`nearby-${nearby.name || 'item'}-${index}`} className="pl-2 md:pl-4 md:basis-1/2">
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
                        <CarouselItem key={`activity-${activity.name || 'item'}-${index}`} className="pl-2 md:pl-4 md:basis-1/2">
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
                        <CarouselItem key={`event-${event.name || 'item'}-${index}`} className="pl-2 md:pl-4 md:basis-1/2">
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
