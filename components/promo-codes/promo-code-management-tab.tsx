"use client"

import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { API_BASE_URL } from "@/lib/config"
import { useToast } from "@/hooks/use-toast"

interface CustomerPromoUsage {
  customerId: string
  customerName: string
  customerEmail: string
  promoCode: string
  promoTitle: string
  usageCount: number
}

interface PromoPackageUsage {
  promoCode: string
  promoTitle: string
  packageId: string
  packageName: string
  usageCount: number
}

interface PackagePromoUsage {
  packageId: string
  packageName: string
  promoCode: string
  promoTitle: string
  usageCount: number
}

export function PromoCodeManagementTab() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("customer-promo")
  
  // Data states
  const [customerPromoData, setCustomerPromoData] = useState<CustomerPromoUsage[]>([])
  const [promoPackageData, setPromoPackageData] = useState<PromoPackageUsage[]>([])
  const [packagePromoData, setPackagePromoData] = useState<PackagePromoUsage[]>([])

  useEffect(() => {
    fetchData(activeTab)
  }, [activeTab])

  const fetchData = async (tab: string) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token')
      
      let endpoint = ''
      if (tab === 'customer-promo') {
        endpoint = `${API_BASE_URL}/api/admin/promo-code/management/customer-usage`
      } else if (tab === 'promo-package') {
        endpoint = `${API_BASE_URL}/api/admin/promo-code/management/promo-package`
      } else if (tab === 'package-promo') {
        endpoint = `${API_BASE_URL}/api/admin/promo-code/management/package-promo`
      }

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()
      
      if (result.status && result.data) {
        if (tab === 'customer-promo') {
          setCustomerPromoData(result.data)
        } else if (tab === 'promo-package') {
          setPromoPackageData(result.data)
        } else if (tab === 'package-promo') {
          setPackagePromoData(result.data)
        }
      } else {
        throw new Error(result.message || "Failed to fetch data")
      }
    } catch (error: any) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getFilteredData = () => {
    if (activeTab === 'customer-promo') {
      return customerPromoData.filter(item =>
        item.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.promoCode.toLowerCase().includes(searchQuery.toLowerCase())
      )
    } else if (activeTab === 'promo-package') {
      return promoPackageData.filter(item =>
        item.promoCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.packageName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    } else {
      return packagePromoData.filter(item =>
        item.packageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.promoCode.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
  }

  const filteredData = getFilteredData()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Promo Code Management</h2>
        <p className="text-sm text-muted-foreground">View promo code usage analytics</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="customer-promo">Customer Promo Usage</TabsTrigger>
          <TabsTrigger value="promo-package">Promo Package Usage</TabsTrigger>
          <TabsTrigger value="package-promo">Package Promo Usage</TabsTrigger>
        </TabsList>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Customer-Promo Usage Tab */}
        <TabsContent value="customer-promo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Based Promo Code Usage</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : filteredData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No data available</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Promo Code</TableHead>
                        <TableHead>Promo Title</TableHead>
                        <TableHead className="text-right">Usage Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.customerName}</TableCell>
                          <TableCell>{item.customerEmail}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.promoCode}</Badge>
                          </TableCell>
                          <TableCell>{item.promoTitle}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary">{item.usageCount}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Promo-Package Usage Tab */}
        <TabsContent value="promo-package" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Promo Code Based Package Usage</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : filteredData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No data available</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Promo Code</TableHead>
                        <TableHead>Promo Title</TableHead>
                        <TableHead>Package Name</TableHead>
                        <TableHead className="text-right">Usage Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Badge variant="outline">{item.promoCode}</Badge>
                          </TableCell>
                          <TableCell>{item.promoTitle}</TableCell>
                          <TableCell className="font-medium">{item.packageName}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary">{item.usageCount}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Package-Promo Usage Tab */}
        <TabsContent value="package-promo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Package Based Promo Code Usage</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : filteredData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No data available</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Package Name</TableHead>
                        <TableHead>Promo Code</TableHead>
                        <TableHead>Promo Title</TableHead>
                        <TableHead className="text-right">Usage Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.packageName}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.promoCode}</Badge>
                          </TableCell>
                          <TableCell>{item.promoTitle}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary">{item.usageCount}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
