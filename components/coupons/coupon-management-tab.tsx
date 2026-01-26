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

interface CustomerCouponUsage {
  customerId: string
  customerName: string
  customerEmail: string
  couponCode: string
  couponTitle: string
  usageCount: number
}

interface CouponPackageUsage {
  couponCode: string
  couponTitle: string
  packageId: string
  packageName: string
  usageCount: number
}

interface PackageCouponUsage {
  packageId: string
  packageName: string
  couponCode: string
  couponTitle: string
  usageCount: number
}

export function CouponManagementTab() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("customer-coupon")
  
  // Data states
  const [customerCouponData, setCustomerCouponData] = useState<CustomerCouponUsage[]>([])
  const [couponPackageData, setCouponPackageData] = useState<CouponPackageUsage[]>([])
  const [packageCouponData, setPackageCouponData] = useState<PackageCouponUsage[]>([])

  useEffect(() => {
    fetchData(activeTab)
  }, [activeTab])

  const fetchData = async (tab: string) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token')
      
      let endpoint = ''
      if (tab === 'customer-coupon') {
        endpoint = `${API_BASE_URL}/api/admin/coupon/management/customer-usage`
      } else if (tab === 'coupon-package') {
        endpoint = `${API_BASE_URL}/api/admin/coupon/management/coupon-package`
      } else if (tab === 'package-coupon') {
        endpoint = `${API_BASE_URL}/api/admin/coupon/management/package-coupon`
      }

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()
      
      if (result.status && result.data) {
        if (tab === 'customer-coupon') {
          setCustomerCouponData(result.data)
        } else if (tab === 'coupon-package') {
          setCouponPackageData(result.data)
        } else if (tab === 'package-coupon') {
          setPackageCouponData(result.data)
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
    if (activeTab === 'customer-coupon') {
      return customerCouponData.filter(item =>
        item.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.couponCode.toLowerCase().includes(searchQuery.toLowerCase())
      )
    } else if (activeTab === 'coupon-package') {
      return couponPackageData.filter(item =>
        item.couponCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.packageName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    } else {
      return packageCouponData.filter(item =>
        item.packageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.couponCode.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
  }

  const filteredData = getFilteredData()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Coupon Management</h2>
        <p className="text-sm text-muted-foreground">View coupon usage analytics</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="customer-coupon">Customer Coupon Usage</TabsTrigger>
          <TabsTrigger value="coupon-package">Coupon Package Usage</TabsTrigger>
          <TabsTrigger value="package-coupon">Package Coupon Usage</TabsTrigger>
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

        {/* Customer-Coupon Usage Tab */}
        <TabsContent value="customer-coupon" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Coupon Usage</CardTitle>
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
                        <TableHead>Coupon Code</TableHead>
                        <TableHead>Coupon Title</TableHead>
                        <TableHead className="text-right">Usage Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.customerName}</TableCell>
                          <TableCell>{item.customerEmail}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.couponCode}</Badge>
                          </TableCell>
                          <TableCell>{item.couponTitle}</TableCell>
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

        {/* Coupon-Package Usage Tab */}
        <TabsContent value="coupon-package" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Coupon Package Usage</CardTitle>
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
                        <TableHead>Coupon Code</TableHead>
                        <TableHead>Coupon Title</TableHead>
                        <TableHead>Package Name</TableHead>
                        <TableHead className="text-right">Usage Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Badge variant="outline">{item.couponCode}</Badge>
                          </TableCell>
                          <TableCell>{item.couponTitle}</TableCell>
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

        {/* Package-Coupon Usage Tab */}
        <TabsContent value="package-coupon" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Package Coupon Usage</CardTitle>
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
                        <TableHead>Coupon Code</TableHead>
                        <TableHead>Coupon Title</TableHead>
                        <TableHead className="text-right">Usage Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.packageName}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.couponCode}</Badge>
                          </TableCell>
                          <TableCell>{item.couponTitle}</TableCell>
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
