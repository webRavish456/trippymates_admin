"use client"

import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { PackageForm } from "@/components/packages/package-form"
import { useToast } from "@/hooks/use-toast"
import { API_BASE_URL } from "@/lib/config"

const API_BASE = `${API_BASE_URL}/api/admin/packages`

export default function EditPackagePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const id = params?.id as string
  const mode = searchParams.get("mode") || "edit" // view or edit
  const [loading, setLoading] = useState(true)
  const [packageData, setPackageData] = useState<any>(null)

  useEffect(() => {
    if (id && id !== "new") {
      fetchPackage()
    } else {
      setLoading(false)
    }
  }, [id])

  const fetchPackage = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE}/packagedetail`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      })
      const result = await response.json()

      if (result.status || result.success) {
        setPackageData(result.data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch package",
          variant: "destructive",
        })
        router.back()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch package",
        variant: "destructive",
      })
      router.back()
    } finally {
      setLoading(false)
    }
  }

  const pageTitle = mode === "view" ? "View Package" : "Edit Package"
  const pageDescription = mode === "view" 
    ? "View package details with destinations and budgets" 
    : "Update package details with destinations and budgets"

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
          <p className="text-muted-foreground">{pageDescription}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading package...</p>
          </div>
        </div>
      ) : (
        <PackageForm initialData={packageData} isEdit={mode === "edit"} />
      )}
    </div>
  )
}

