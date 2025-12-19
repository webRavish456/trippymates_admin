"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function CaptainAssignmentNewPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/admin/captain/assignment')
  }, [router])
  
  return null
}

