"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Edit, Trash2, Eye, Star, Activity, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { API_BASE_URL } from "@/lib/config"
import { TableRowSkeleton } from "@/components/ui/skeletons"
import { useSelector } from "react-redux"
import { RootState } from "@/components/redux/store"

interface SeasonDestination {
  _id: string
  title: string
  color: string
  places: string
  placesSummary?: string
  desc: string
  image: string
  type: "season"
  status: "active" | "inactive"
  createdAt: string
  placesDetails?: any[]
}

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

export function SeasonDestinationTab() {
  const permissions = useSelector(
    (state: RootState) => state.permission.permissions
  )
  const router = useRouter()
  const [hasPermission, setHasPermission] = useState<ExploreDestinationPermission>({
    create: false,
    update: false,
    delete: false,
  })
  const [destinations, setDestinations] = useState<SeasonDestination[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [selectedDestination, setSelectedDestination] = useState<SeasonDestination | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchDestinations()
    setCurrentPage(1) // Reset to first page when search changes
  }, [searchQuery])

  useEffect(() => {
    const seasonDestinationPermission = permissions.find(
      (p: Permission) => p.module === "explore_destination"
    )
    setHasPermission({
      create: seasonDestinationPermission?.create ?? false,
      update: seasonDestinationPermission?.update ?? false,
      delete: seasonDestinationPermission?.delete ?? false,
    })
  }, [])

  const fetchDestinations = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        ...(searchQuery && { search: searchQuery }),
      })
      const response = await fetch(`${API_BASE}/season?${params}`)
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

  const openDetailsDialog = async (destination: SeasonDestination) => {
    try {
      const response = await fetch(`${API_BASE}/${destination._id}`)
      const result = await response.json()
      if (result.status || result.success) {
        // Ensure placesDetails is an array
        const data = { ...result.data }
        if (data.placesDetails) {
          if (!Array.isArray(data.placesDetails)) {
            // Convert object to array if it's an object
            // Filter out non-numeric keys to get only the array items
            if (typeof data.placesDetails === 'object' && data.placesDetails !== null) {
              const values = Object.values(data.placesDetails)
              // Filter to ensure we only have valid place objects (with placeName property)
              data.placesDetails = values.filter((item: any) => item && typeof item === 'object' && (item.placeName || item.name))
            } else {
              data.placesDetails = []
            }
          }
        }
        setSelectedDestination(data)
        setIsDetailsDialogOpen(true)
      }
    } catch (error) {
      console.error("Fetch error:", error)
      // Don't show toast for GET requests
    }
  }

  const filteredDestinations = destinations.filter((dest) =>
    dest.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dest.places?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dest.placesSummary?.toLowerCase().includes(searchQuery.toLowerCase())
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Season Destinations</h2>
          <p className="text-sm text-muted-foreground">Manage monthly/seasonal travel destinations</p>
        </div>
        {hasPermission.create && <Button onClick={() => router.push("/admin/explore-destination/season/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Add Season Destination
        </Button>}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by month or places..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {(() => {
        if (loading) {
          return (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Season</TableHead>
                    <TableHead>Best Time</TableHead>
                    <TableHead>Activities</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <TableRowSkeleton key={`skeleton-${index}`} columns={5} />
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
                No destinations found. Create your first season destination!
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
                <TableHead className="w-20">Image</TableHead>
                <TableHead className="w-32">Month</TableHead>
                <TableHead className="w-32">Places</TableHead>
                <TableHead className="min-w-[250px]">Description</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="text-right w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDestinations.map((destination) => (
                <TableRow key={destination._id}>
                  <TableCell className="w-20">
                    {destination.image ? (
                      <img
                        src={destination.image}
                        alt={destination.title}
                        className="h-12 w-12 rounded object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                        <div className="text-xs text-muted-foreground">No Image</div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="w-32 font-medium">{destination.title}</TableCell>
                  <TableCell className="w-32">{destination.placesSummary || destination.places || "N/A"}</TableCell>
                  <TableCell className="min-w-[250px] max-w-[350px]">
                    {destination.desc ? (
                      <span className="text-sm" title={destination.desc}>
                        {destination.desc.length > 30 
                          ? `${destination.desc.substring(0, 30)}...` 
                          : destination.desc}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="w-24">
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
                      {hasPermission.update && <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/admin/explore-destination/season/${destination._id}`)}
                      >
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
      })()}

      {/* Details View Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-[900px] sm:max-w-[900px] md:max-w-[900px] lg:max-w-[900px] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedDestination?.title}</DialogTitle>
          </DialogHeader>
          {selectedDestination && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-sm text-muted-foreground">{selectedDestination.desc}</p>
              </div>
              {selectedDestination.placesDetails && Array.isArray(selectedDestination.placesDetails) && selectedDestination.placesDetails.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-4">Place Details</h3>
                  <Tabs defaultValue="0" className="w-full">
                    <TabsList className="flex w-fit flex-wrap gap-2 ">
                      {selectedDestination.placesDetails
                        .filter((place: any) => place && typeof place === 'object' && (place.placeName || place.name))
                        .map((place: any, index: number) => (
                        <TabsTrigger key={index} value={String(index)} className="whitespace-nowrap">
                          {place.placeName || place.name || `Place ${index + 1}`}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {selectedDestination.placesDetails
                      .filter((place: any) => place && typeof place === 'object' && (place.placeName || place.name))
                      .map((place: any, index: number) => (
                      <TabsContent key={index} value={String(index)} className="mt-4">
                        <div className="border rounded-lg p-6 space-y-6">
                        <div>
                          <h4 className="text-xl font-bold mb-2">{place.placeName || place.name || 'Place'}</h4>
                          {place.location && (
                            <p className="text-sm text-muted-foreground mb-4">📍 {place.location}</p>
                          )}
                          {place.images && Array.isArray(place.images) && place.images.length > 0 && (
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

                        {place.topAttractions && Array.isArray(place.topAttractions) && place.topAttractions.length > 0 && (
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

                        {place.food && Array.isArray(place.food) && place.food.length > 0 && (
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

                        {place.hotels && Array.isArray(place.hotels) && place.hotels.length > 0 && (
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

                        {place.activities && Array.isArray(place.activities) && place.activities.length > 0 && (
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

                        {place.eventsFestivals && Array.isArray(place.eventsFestivals) && place.eventsFestivals.length > 0 && (
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

                        {place.nearbyDestinations && Array.isArray(place.nearbyDestinations) && place.nearbyDestinations.length > 0 && (
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
              This action cannot be undone. This will permanently delete the destination "{selectedDestination?.title}".
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
