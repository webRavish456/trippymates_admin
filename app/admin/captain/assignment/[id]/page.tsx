"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function CaptainAssignmentFormPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/admin/captain/assignment')
  }, [router])
  
  return null
}

