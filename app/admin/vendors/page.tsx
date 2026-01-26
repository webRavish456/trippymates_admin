"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Eye, UserCheck, UserX, Plus, Edit, Trash2, Building2, Mail, Phone, Calendar, FileText, Clock, Key, Download, File, Image } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { API_BASE_URL } from "@/lib/config"
import { CardSkeleton } from "@/components/ui/skeletons"
import { useSelector } from "react-redux"

import { RootState } from "@/components/redux/store"


interface FileDocument {
  filename: string
  path: string
  mimetype: string
  size: number
}

interface Vendor {
  _id: string
  name: string
  address: string
  email: string
  typeOfId: string
  idNumber: string
  businessName: string
  businessType: string
  businessRegistrationNo: string
  gstNo: string
  description: string
  operatingHours: string
  status: string
  createdAt: string
  updatedAt: string
  username?: string
  vendorGovernmentId?: FileDocument
  companyLogo?: FileDocument
  businessProof?: FileDocument
}

interface Pagination {
  currentPage: number
  totalPages: number
  totalVendors: number
  hasNextPage: boolean
  hasPrevPage: boolean
  limit: number
}

interface ApiResponse {
  status: boolean
  message: string
  data: Vendor[]
  pagination: Pagination
}

type Permission = {
  module: string;
  create: boolean;
  read?: boolean;
  update?: boolean;
  delete?: boolean;
};

type VendorsPermission = {
  create: boolean;
  update: boolean;
  delete: boolean;
};

export default function VendorManagement() {

  const permissions = useSelector(
    (state: RootState) => state.permission.permissions
  )
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isCredentialsOpen, setIsCredentialsOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const { toast } = useToast()

  const router = useRouter()

  const [hasPermission, setHasPermission] = useState<VendorsPermission>({
    create: false,
    update: false,
    delete: false,
  })

  useEffect(() => {
    const vendorsPermission = permissions.find(
      (p: Permission) => p.module === "vendors"
    )
    setHasPermission({
      create: vendorsPermission?.create ?? false,
      update: vendorsPermission?.update ?? false,
      delete: vendorsPermission?.delete ?? false,
    })
  }, [])

  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  })

  useEffect(() => {
    fetchVendors(currentPage)
  }, [currentPage])

  const fetchVendors = async (page: number) => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/admin/vendor/getVendor?page=${page}`)
      const result: ApiResponse = await response.json()
      
      if (result.status) {
        setVendors(result.data)
        setPagination(result.pagination)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch vendors",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const handleDownloadFile = (fileUrl: string, filename: string, mimetype: string) => {
    try {
      // For PDFs, open in new tab to view
      if (mimetype === 'application/pdf') {
        window.open(fileUrl, '_blank', 'noopener,noreferrer')
        toast({
          title: "Success",
          description: `Opening ${filename} in new tab`,
        })
      } else {
        // For images, trigger download
        const link = document.createElement('a')
        link.href = fileUrl
        link.download = filename
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        toast({
          title: "Success",
          description: `Downloading ${filename}`,
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open file",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const month = months[date.getMonth()]
    const year = date.getFullYear()
    return `${day} ${month} ${year}`
  }

  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch =
      vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.businessName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || vendor.status.toLowerCase() === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  const handleViewDetails = (vendor: Vendor) => {
    setSelectedVendor(vendor)
    setIsDetailsOpen(true)
  }

  const handleAddVendor = () => {
    router.push('/admin/vendors/new')
  }

  const handleEditVendor = (vendor: Vendor) => {
    router.push(`/admin/vendors/${vendor._id}`)
  }

  const handleDeleteVendor = async () => {
    if (!selectedVendor) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/vendor/deleteVendor/${selectedVendor._id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.status) {
        toast({
          title: "Success",
          description: "Vendor deleted successfully",
        })
        setIsDeleteOpen(false)
        fetchVendors(currentPage)
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete vendor",
        variant: "destructive",
      })
    }
  }

  const handleToggleStatus = async (vendorId: string) => {
    const vendor = vendors.find((v) => v._id === vendorId)
    if (!vendor) return

    const newStatus = vendor.status === "Active" ? "Inactive" : "Active"
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/vendor/changeVendorStatus`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id:vendorId,status: newStatus }),
      })

      const result = await response.json()

      if (result.status) {
        setVendors(
          vendors.map((v) =>
            v._id === vendorId ? { ...v, status: newStatus } : v
          )
        )
        toast({
          title: "Status Updated",
          description: `${vendor.businessName} has been ${newStatus.toLowerCase()}`,
        })
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update vendor status",
        variant: "destructive",
      })
    }
  }

  const handleAllotCredentials = (vendor: Vendor) => {
    setSelectedVendor(vendor)
    setCredentials({
      username: vendor.username || "",
      password: "",
    })
    setIsCredentialsOpen(true)
  }

  const handleSaveCredentials = async () => {
    if (!selectedVendor) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/vendor/addVendor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: selectedVendor._id,
          username: credentials.username,
          password: credentials.password,
        }),
      })

      const result = await response.json()

      if (result.status) {
        toast({
          title: "Success",
          description: "Credentials allotted successfully",
        })
        setIsCredentialsOpen(false)
        fetchVendors(currentPage)
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to allot credentials",
        variant: "destructive",
      })
    }
  }

  const stats = {
    total: pagination?.totalVendors || 0,
    active: vendors.filter((v) => v.status === "Active").length,
    inactive: vendors.filter((v) => v.status === "Inactive").length,
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <CardSkeleton key={`vendor-skeleton-${index}`} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendor Management</h1>
          <p className="text-muted-foreground">Manage vendors and their credentials</p>
        </div>
        {hasPermission.create && <Button onClick={handleAddVendor}>
          <Plus className="h-4 w-4 mr-2" />
          Add Vendor
        </Button>}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or business..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Vendor</th>
                  <th className="text-left p-4 font-medium">Business</th>
                  <th className="text-left p-4 font-medium">Contact</th>
                  <th className="text-left p-4 font-medium">Username</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-right p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVendors.map((vendor) => (
                  <tr key={vendor._id} className="border-b hover:bg-muted/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {vendor.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{vendor.name}</div>
                          <div className="text-xs text-muted-foreground">{vendor.typeOfId}: {vendor.idNumber}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <div className="font-medium">{vendor.businessName}</div>
                        <div className="text-xs text-muted-foreground">{vendor.businessType}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <div className="text-sm">{vendor.email}</div>
                        <div className="text-xs text-muted-foreground">{vendor.gstNo}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      {vendor.username ? (
                        <Badge variant="outline">{vendor.username}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not assigned</span>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge variant={vendor.status === "Active" ? "default" : "destructive"}>
                        {vendor.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleViewDetails(vendor)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                       <Button variant="ghost" size="icon" onClick={() => handleAllotCredentials(vendor)}>
                          <Key className="h-4 w-4" />
                        </Button>
                        {hasPermission.update && <Button variant="ghost" size="icon" onClick={() => handleEditVendor(vendor)}>
                          <Edit className="h-4 w-4" />
                        </Button>}
                        {hasPermission.delete && <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleStatus(vendor._id)}
                        >
                          {vendor.status === "Active" ? (
                            <UserX className="h-4 w-4 text-red-600" />
                          ) : (
                            <UserCheck className="h-4 w-4 text-green-600" />
                          )}
                        </Button>}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedVendor(vendor)
                            setIsDeleteOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {pagination.currentPage} of {pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vendor Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vendor Details</DialogTitle>
            <DialogDescription>Complete information about this vendor</DialogDescription>
          </DialogHeader>

          {selectedVendor && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vendor Name</Label>
                  <div className="text-sm font-medium">{selectedVendor.name}</div>
                </div>
                <div className="space-y-2">
                  <Label>Business Name</Label>
                  <div className="text-sm font-medium">{selectedVendor.businessName}</div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="text-sm">{selectedVendor.email}</div>
                </div>
                <div className="space-y-2">
                  <Label>Business Type</Label>
                  <div className="text-sm">{selectedVendor.businessType}</div>
                </div>
                <div className="space-y-2">
                  <Label>ID Type</Label>
                  <div className="text-sm">{selectedVendor.typeOfId}</div>
                </div>
                <div className="space-y-2">
                  <Label>ID Number</Label>
                  <div className="text-sm font-mono">{selectedVendor.idNumber}</div>
                </div>
                <div className="space-y-2">
                  <Label>Business Registration</Label>
                  <div className="text-sm font-mono">{selectedVendor.businessRegistrationNo}</div>
                </div>
                <div className="space-y-2">
                  <Label>GST Number</Label>
                  <div className="text-sm font-mono">{selectedVendor.gstNo}</div>
                </div>
                <div className="space-y-2">
                  <Label>Operating Hours</Label>
                  <div className="text-sm">{selectedVendor.operatingHours}</div>
                </div>
                <div className="space-y-2">
                  <Label>Username</Label>
                  <div className="text-sm font-medium">{selectedVendor.username || "Not assigned"}</div>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Badge variant={selectedVendor.status === "Active" ? "default" : "destructive"}>
                    {selectedVendor.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label>Joined Date</Label>
                  <div className="text-sm">{formatDate(selectedVendor.createdAt)}</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Address</Label>
                <div className="text-sm">{selectedVendor.address}</div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <div className="text-sm">{selectedVendor.description}</div>
              </div>

              <Separator />

              {/* Documents Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Documents</h3>
                
                {/* Company Logo */}
                {selectedVendor.companyLogo && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Image className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">Company Logo</div>
                            <div className="text-xs text-muted-foreground">
                              {selectedVendor.companyLogo.filename}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatFileSize(selectedVendor.companyLogo.size)} • {selectedVendor.companyLogo.mimetype}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadFile(selectedVendor.companyLogo!.path, selectedVendor.companyLogo!.filename, selectedVendor.companyLogo!.mimetype)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Government ID */}
                {selectedVendor.vendorGovernmentId && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <File className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">Government ID</div>
                            <div className="text-xs text-muted-foreground">
                              {selectedVendor.vendorGovernmentId.filename}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatFileSize(selectedVendor.vendorGovernmentId.size)} • {selectedVendor.vendorGovernmentId.mimetype}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadFile(selectedVendor.vendorGovernmentId!.path, selectedVendor.vendorGovernmentId!.filename, selectedVendor.vendorGovernmentId!.mimetype)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Business Proof */}
                {selectedVendor.businessProof && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <FileText className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">Business Proof</div>
                            <div className="text-xs text-muted-foreground">
                              {selectedVendor.businessProof.filename}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatFileSize(selectedVendor.businessProof.size)} • {selectedVendor.businessProof.mimetype}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadFile(selectedVendor.businessProof!.path, selectedVendor.businessProof!.filename, selectedVendor.businessProof!.mimetype)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!selectedVendor.companyLogo && !selectedVendor.vendorGovernmentId && !selectedVendor.businessProof && (
                  <div className="text-center py-8 text-muted-foreground">
                    No documents uploaded
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Allot Credentials Dialog */}
      <Dialog open={isCredentialsOpen} onOpenChange={setIsCredentialsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Allot Login Credentials</DialogTitle>
            <DialogDescription>
              Assign username and password for {selectedVendor?.businessName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Username</Label>
              <Input
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                placeholder="vendor_username"
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                placeholder="Enter password"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCredentialsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCredentials}>
              Allot Credentials
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Vendor</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedVendor?.businessName}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteVendor}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}