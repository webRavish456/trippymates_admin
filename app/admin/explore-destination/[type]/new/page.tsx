"use client"

import { useParams, useRouter } from "next/navigation"
import { PopularDestinationForm } from "@/components/destinations/popular-destination-form"
import { SeasonDestinationForm } from "@/components/destinations/season-destination-form"
import { CategoryDestinationForm } from "@/components/destinations/category-destination-form"
import { RegionDestinationForm } from "@/components/destinations/region-destination-form"
import { AdventureActivitiesForm } from "@/components/destinations/adventure-activities-form"
import { CultureHeritageForm } from "@/components/destinations/culture-heritage-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function NewDestinationPage() {
  const params = useParams()
  const router = useRouter()
  const type = params?.type as string

  const getFormComponent = () => {
    switch (type) {
      case "popular":
        return <PopularDestinationForm />
      case "season":
        return <SeasonDestinationForm />
      case "category":
        return <CategoryDestinationForm />
      case "region":
        return <RegionDestinationForm />
      case "adventure":
        return <AdventureActivitiesForm />
      case "culture":
        return <CultureHeritageForm />
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
          <h1 className="text-3xl font-bold tracking-tight">Add New {getTitle()}</h1>
          <p className="text-muted-foreground">Create a new destination with all details</p>
        </div>
      </div>

      {getFormComponent()}
    </div>
  )
}

