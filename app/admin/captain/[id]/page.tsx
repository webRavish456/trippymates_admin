"use client"

import { useParams, useSearchParams } from "next/navigation"
import { CaptainFormTab } from "@/components/captains/captain-form-tab"
import { CaptainViewTab } from "@/components/captains/captain-view-tab"

export default function CaptainFormPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const captainId = params?.id as string
  const mode = searchParams?.get('mode') || 'edit'

  return (
    <div className="space-y-4">
      {captainId && captainId !== 'new' ? (
        mode === 'view' ? (
          <CaptainViewTab />
        ) : (
          <CaptainFormTab />
        )
      ) : (
        <CaptainFormTab />
      )}
    </div>
  )
}
