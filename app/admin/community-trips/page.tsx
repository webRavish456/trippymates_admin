"use client"

import { CommunityTripsTab } from "@/components/content/community-trips-tab"

export default function CommunityTripsPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Community Trips</h1>
        <p className="text-muted-foreground">Manage community trips and member interactions</p>
      </div>
      <CommunityTripsTab />
    </div>
  )
}

