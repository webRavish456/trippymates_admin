"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { PopularDestinationForm } from "@/components/destinations/popular-destination-form"
import { SeasonDestinationForm } from "@/components/destinations/season-destination-form"
import { CategoryDestinationForm } from "@/components/destinations/category-destination-form"
import { RegionDestinationForm } from "@/components/destinations/region-destination-form"
import { AdventureActivitiesForm } from "@/components/destinations/adventure-activities-form"
import { CultureHeritageForm } from "@/components/destinations/culture-heritage-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { API_BASE_URL } from "@/lib/config"
import { EditPageSkeleton } from "@/components/ui/skeletons"

const API_BASE = `${API_BASE_URL}/api/admin/destination`

export default function EditDestinationPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const type = params?.type as string
  const id = params?.id as string
  const [loading, setLoading] = useState(true)
  const [destination, setDestination] = useState<any>(null)

  useEffect(() => {
    if (id && id !== "new") {
      fetchDestination()
    } else {
      setLoading(false)
    }
  }, [id])

  const fetchDestination = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE}/${id}`)
      const result = await response.json()

      if (result.status || result.success) {
        setDestination(result.data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch destination",
          variant: "destructive",
        })
        router.back()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch destination",
        variant: "destructive",
      })
      router.back()
    } finally {
      setLoading(false)
    }
  }

  const getFormComponent = () => {
    if (loading) {
      return <EditPageSkeleton />
    }

    switch (type) {
      case "popular":
        return <PopularDestinationForm initialData={destination} isEdit={true} />
      case "season":
        return <SeasonDestinationForm initialData={destination} isEdit={true} />
      case "category":
        return <CategoryDestinationForm initialData={destination} isEdit={true} />
      case "region":
        return <RegionDestinationForm initialData={destination} isEdit={true} />
      case "adventure":
        return <AdventureActivitiesForm initialData={destination} isEdit={true} />
      case "culture":
        return <CultureHeritageForm initialData={destination} isEdit={true} />
      default:
        return <div>Invalid destination type</div>
    }
  }

  const getTitle = () => {
    switch (type) {
      case "popular":
        return "Popular Destination"
      case "season":
        return "Season Destination"
      case "category":
        return "Category Destination"
      case "region":
        return "Region Destination"
      case "adventure":
        return "Adventure Activity"
      case "culture":
        return "Culture & Heritage Destination"
      default:
        return "Destination"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit {getTitle()}</h1>
          <p className="text-muted-foreground">Update destination details</p>
        </div>
      </div>

      {getFormComponent()}
    </div>
  )
}

