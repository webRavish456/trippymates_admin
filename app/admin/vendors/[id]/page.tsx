"use client"

import { useParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VendorFormTab } from "@/components/vendors/vendor-form-tab"
import { VendorPaymentTab } from "@/components/vendors/vendor-payment-tab"

export default function VendorFormPage() {
  const params = useParams()
  const vendorId = params?.id as string

  return (
    <div className="space-y-4">
      {vendorId && vendorId !== 'new' ? (
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Vendor Details</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="mt-4">
            <VendorFormTab />
          </TabsContent>
          <TabsContent value="payments" className="mt-4">
            <VendorPaymentTab vendorId={vendorId} />
          </TabsContent>
        </Tabs>
      ) : (
        <VendorFormTab />
      )}
    </div>
  )
}

