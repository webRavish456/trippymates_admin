"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Download, TrendingUp, TrendingDown, Package, Building2, UserCheck, Calendar, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { useToast } from "@/hooks/use-toast"
import { API_BASE_URL } from "@/lib/config"

export default function ReportsPage() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const [dateRange, setDateRange] = useState("last30days")
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("income")

  useEffect(() => {
    if (tabParam && ["income", "expense", "trip", "vendors", "captains"].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])
  
  // Pagination states for each tab
  const [incomePage, setIncomePage] = useState(1)
  const [expensePage, setExpensePage] = useState(1)
  const [tripPage, setTripPage] = useState(1)
  const [vendorPage, setVendorPage] = useState(1)
  const [captainPage, setCaptainPage] = useState(1)
  const itemsPerPage = 10

  // Data states
  const [incomeData, setIncomeData] = useState<any[]>([])
  const [expenseData, setExpenseData] = useState<any[]>([])
  const [tripData, setTripData] = useState<any[]>([])
  const [vendorData, setVendorData] = useState<any[]>([])
  const [captainData, setCaptainData] = useState<any[]>([])

  // Fetch data functions
  const fetchIncomeData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${API_BASE_URL}/api/admin/reports/income?dateRange=${dateRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const result = await response.json()
      if (result.success && result.data) {
        setIncomeData(result.data)
      } else {
        setIncomeData([])
      }
    } catch (error) {
      console.error("Error fetching income data:", error)
      setIncomeData([])
      // Don't show error toast, just show empty state
    } finally {
      setLoading(false)
    }
  }

  const fetchExpenseData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${API_BASE_URL}/api/admin/reports/expense?dateRange=${dateRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const result = await response.json()
      if (result.success && result.data) {
        setExpenseData(result.data)
      } else {
        setExpenseData([])
      }
    } catch (error) {
      console.error("Error fetching expense data:", error)
      setExpenseData([])
      // Don't show error toast, just show empty state
    } finally {
      setLoading(false)
    }
  }

  const fetchTripData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${API_BASE_URL}/api/admin/reports/trips?dateRange=${dateRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const result = await response.json()
      if (result.success && result.data) {
        setTripData(result.data)
      } else {
        setTripData([])
      }
    } catch (error) {
      console.error("Error fetching trip data:", error)
      setTripData([])
      // Don't show error toast, just show empty state
    } finally {
      setLoading(false)
    }
  }

  const fetchVendorData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${API_BASE_URL}/api/admin/reports/vendors?dateRange=${dateRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const result = await response.json()
      if (result.success && result.data) {
        setVendorData(result.data)
      } else {
        setVendorData([])
      }
    } catch (error) {
      console.error("Error fetching vendor data:", error)
      setVendorData([])
      // Don't show error toast, just show empty state
    } finally {
      setLoading(false)
    }
  }

  const fetchCaptainData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${API_BASE_URL}/api/admin/reports/captains?dateRange=${dateRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const result = await response.json()
      if (result.success && result.data) {
        setCaptainData(result.data)
      } else {
        setCaptainData([])
      }
    } catch (error) {
      console.error("Error fetching captain data:", error)
      setCaptainData([])
      // Don't show error toast, just show empty state
    } finally {
      setLoading(false)
    }
  }

  // Fetch data when dateRange changes
  useEffect(() => {
    fetchIncomeData()
    fetchExpenseData()
    fetchTripData()
    fetchVendorData()
    fetchCaptainData()
  }, [dateRange])

  const handleExport = async (reportType: string, format: string = "xlsx") => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${API_BASE_URL}/api/admin/reports/export`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reportType, format, dateRange })
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${reportType}_report_${dateRange}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast({
          title: "Success",
          description: `${reportType} report exported successfully`,
        })
      } else {
        throw new Error('Export failed')
      }
    } catch (error) {
      console.error("Error exporting report:", error)
      toast({
        title: "Error",
        description: "Failed to export report",
        variant: "destructive"
      })
    }
  }

  // Pagination logic
  const getPaginatedData = (data: any[], page: number) => {
    const startIndex = (page - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return data.slice(startIndex, endIndex)
  }

  const getTotalPages = (dataLength: number) => Math.ceil(dataLength / itemsPerPage)

  const handlePageChange = (page: number, setPage: (page: number) => void) => {
    setPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Paginated data
  const paginatedIncomeData = getPaginatedData(incomeData, incomePage)
  const paginatedExpenseData = getPaginatedData(expenseData, expensePage)
  const paginatedTripData = getPaginatedData(tripData, tripPage)
  const paginatedVendorData = getPaginatedData(vendorData, vendorPage)
  const paginatedCaptainData = getPaginatedData(captainData, captainPage)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">View and export detailed business reports</p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="last7days">Last 7 Days</SelectItem>
            <SelectItem value="last30days">Last 30 Days</SelectItem>
            <SelectItem value="last3months">Last 3 Months</SelectItem>
            <SelectItem value="last6months">Last 6 Months</SelectItem>
            <SelectItem value="thisyear">This Year</SelectItem>
            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="expense">Expense</TabsTrigger>
          <TabsTrigger value="trip">Trip Report</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="captains">Captains</TabsTrigger>
        </TabsList>

        {/* Income Report Tab */}
        <TabsContent value="income" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Income Transactions</CardTitle>
                  <CardDescription>Detailed list of all income transactions</CardDescription>
                </div>
                <Button onClick={() => handleExport("Income", "xlsx")}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedIncomeData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No income data available for the selected period
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedIncomeData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.date}</TableCell>
                        <TableCell>{item.source}</TableCell>
                        <TableCell>{item.customer}</TableCell>
                        <TableCell className="text-right">₹{item.amount?.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={item.status === "Completed" ? "default" : "secondary"}>
                            {item.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>

            {/* Pagination */}
            {getTotalPages(incomeData.length) > 1 && (
              <div className="pb-4">
                <Pagination className="flex justify-end">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => handlePageChange(Math.max(1, incomePage - 1), setIncomePage)}
                        className={incomePage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {Array.from({ length: getTotalPages(incomeData.length) }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => handlePageChange(page, setIncomePage)}
                          isActive={incomePage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => handlePageChange(Math.min(getTotalPages(incomeData.length), incomePage + 1), setIncomePage)}
                        className={incomePage === getTotalPages(incomeData.length) ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Expense Report Tab */}
        <TabsContent value="expense" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Expense Transactions</CardTitle>
                  <CardDescription>Detailed list of all expenses</CardDescription>
                </div>
                <Button onClick={() => handleExport("Expense", "xlsx")}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedExpenseData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No expense data available for the selected period
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedExpenseData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.date}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-right">₹{item.amount?.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={item.status === "Paid" ? "default" : "secondary"}>
                            {item.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>

            {/* Pagination */}
            {getTotalPages(expenseData.length) > 1 && (
              <div className="pb-4">
                <Pagination className="flex justify-end">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => handlePageChange(Math.max(1, expensePage - 1), setExpensePage)}
                        className={expensePage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {Array.from({ length: getTotalPages(expenseData.length) }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => handlePageChange(page, setExpensePage)}
                          isActive={expensePage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => handlePageChange(Math.min(getTotalPages(expenseData.length), expensePage + 1), setExpensePage)}
                        className={expensePage === getTotalPages(expenseData.length) ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Trip Report Tab */}
        <TabsContent value="trip" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Trip Details</CardTitle>
                  <CardDescription>Performance metrics for all trips</CardDescription>
                </div>
                <Button onClick={() => handleExport("Trip", "xlsx")}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Package Name</TableHead>
                    <TableHead>Trip Date</TableHead>
                    <TableHead className="text-right">Participants</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTripData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No trip data available for the selected period
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedTripData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.package}</TableCell>
                        <TableCell>{item.date}</TableCell>
                        <TableCell className="text-right">{item.participants}</TableCell>
                        <TableCell className="text-right">₹{item.revenue?.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              item.status === "Completed" ? "default" : 
                              item.status === "Ongoing" ? "secondary" : 
                              "outline"
                            }
                          >
                            {item.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>

            {/* Pagination */}
            {getTotalPages(tripData.length) > 1 && (
              <div className="pb-4">
                <Pagination className="flex justify-end">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => handlePageChange(Math.max(1, tripPage - 1), setTripPage)}
                        className={tripPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {Array.from({ length: getTotalPages(tripData.length) }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => handlePageChange(page, setTripPage)}
                          isActive={tripPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => handlePageChange(Math.min(getTotalPages(tripData.length), tripPage + 1), setTripPage)}
                        className={tripPage === getTotalPages(tripData.length) ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Vendors Report Tab */}
        <TabsContent value="vendors" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Vendor Payment Report</CardTitle>
                  <CardDescription>Payment summary for all vendors</CardDescription>
                </div>
                <Button onClick={() => handleExport("Vendors", "xlsx")}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor Name</TableHead>
                    <TableHead className="text-right">Trips</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Pending</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedVendorData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No vendor data available for the selected period
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedVendorData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.vendor}</TableCell>
                        <TableCell className="text-right">{item.trips}</TableCell>
                        <TableCell className="text-right">₹{item.totalAmount?.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-green-600">₹{item.paid?.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          {item.pending > 0 ? (
                            <span className="text-orange-600">₹{item.pending?.toLocaleString()}</span>
                          ) : (
                            <Badge variant="default">Settled</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>

            {/* Pagination */}
            {getTotalPages(vendorData.length) > 1 && (
              <div className="pb-4">
                <Pagination className="flex justify-end">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => handlePageChange(Math.max(1, vendorPage - 1), setVendorPage)}
                        className={vendorPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {Array.from({ length: getTotalPages(vendorData.length) }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => handlePageChange(page, setVendorPage)}
                          isActive={vendorPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => handlePageChange(Math.min(getTotalPages(vendorData.length), vendorPage + 1), setVendorPage)}
                        className={vendorPage === getTotalPages(vendorData.length) ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Captains Report Tab */}
        <TabsContent value="captains" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Captain Performance Report</CardTitle>
                  <CardDescription>Performance metrics for all captains</CardDescription>
                </div>
                <Button onClick={() => handleExport("Captains", "xlsx")}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Captain Name</TableHead>
                    <TableHead className="text-right">Trips</TableHead>
                    <TableHead className="text-right">Rating</TableHead>
                    <TableHead className="text-right">Earnings</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCaptainData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No captain data available for the selected period
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedCaptainData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.captain}</TableCell>
                        <TableCell className="text-right">{item.trips}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-yellow-500">★</span>
                            <span>{item.rating}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">₹{item.earnings?.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={item.status === "Active" ? "default" : "secondary"}>
                            {item.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>

            {/* Pagination */}
            {getTotalPages(captainData.length) > 1 && (
              <div className="pb-4">
                <Pagination className="flex justify-end">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => handlePageChange(Math.max(1, captainPage - 1), setCaptainPage)}
                        className={captainPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {Array.from({ length: getTotalPages(captainData.length) }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => handlePageChange(page, setCaptainPage)}
                          isActive={captainPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => handlePageChange(Math.min(getTotalPages(captainData.length), captainPage + 1), setCaptainPage)}
                        className={captainPage === getTotalPages(captainData.length) ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}