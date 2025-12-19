"use client"

import { useSearchParams } from "next/navigation"
import CommunityTripForm from "@/components/community-trips/community-trip-form"
import CommunityTripView from "@/components/community-trips/community-trip-view"

export default function CommunityTripDetailPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') || 'view'
  const tripId = params.id

  if (mode === 'edit') {
    return <CommunityTripForm tripId={tripId} />
  }

  return <CommunityTripView tripId={tripId} />
}

