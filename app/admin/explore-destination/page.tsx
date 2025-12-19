"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { PopularDestinationTab } from "@/components/destinations/popular-destination-tab"
import { SeasonDestinationTab } from "@/components/destinations/season-destination-tab"
import { CategoryDestinationTab } from "@/components/destinations/category-destination-tab"
import { RegionDestinationTab } from "@/components/destinations/region-destination-tab"
import { AdventureActivitiesTab } from "@/components/destinations/adventure-activities-tab"
import { CultureHeritageTab } from "@/components/destinations/culture-heritage-tab"

export default function ExploreDestinationPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tabParam = searchParams.get("tab")
  const [activeTab, setActiveTab] = useState(tabParam || "popular")

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam)
    } else {
      setActiveTab("popular")
    }
  }, [tabParam])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    const url = value === "popular" 
      ? "/admin/explore-destination" 
      : `/admin/explore-destination?tab=${value}`
    router.replace(url, { scroll: false })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-balance">Explore Destination</h1>
        <p className="text-muted-foreground">Manage destinations, categories, regions, and activities</p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="popular">Popular Destination</TabsTrigger>
          <TabsTrigger value="season">Season Destination</TabsTrigger>
          <TabsTrigger value="category">Category</TabsTrigger>
          <TabsTrigger value="region">Region Destination</TabsTrigger>
          <TabsTrigger value="adventure">Adventure Activities</TabsTrigger>
          <TabsTrigger value="culture">Culture & Heritage</TabsTrigger>
        </TabsList>

        <TabsContent value="popular" className="space-y-4">
          <PopularDestinationTab />
        </TabsContent>

        <TabsContent value="season" className="space-y-4">
          <SeasonDestinationTab />
        </TabsContent>

        <TabsContent value="category" className="space-y-4">
          <CategoryDestinationTab />
        </TabsContent>

        <TabsContent value="region" className="space-y-4">
          <RegionDestinationTab />
        </TabsContent>

        <TabsContent value="adventure" className="space-y-4">
          <AdventureActivitiesTab />
        </TabsContent>

        <TabsContent value="culture" className="space-y-4">
          <CultureHeritageTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

