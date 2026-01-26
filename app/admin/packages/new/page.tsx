"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { PackageForm } from "@/components/packages/package-form"

export default function NewPackagePage() {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Package</h1>
          <p className="text-muted-foreground">Create a new travel package with destinations and budgets</p>
        </div>
      </div>

      <PackageForm isEdit={true} />
    </div>
  )
}

