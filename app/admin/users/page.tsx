"use client"

import { useEffect, useState } from "react"
import { Eye, Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { API_BASE_URL } from "@/lib/config"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useSelector } from "react-redux"
import { RootState } from "@/components/redux/store"

/* ================= TYPES ================= */

type Status = "Active" | "Inactive"

interface User {
  _id: string
  roleName: string
  name: string
  email: string
  phone: string
  status: Status
}

interface UserForm {
  roleName: string
  password: string
  confirmPassword: string
  name: string
  email: string
  phone: string
  status: Status
}

/* ================= CONSTANTS ================= */

/* ================= PAGE ================= */

type Permission = {
  module: string;
  create: boolean;
  read?: boolean;
  update?: boolean;
  delete?: boolean;
};

type UsersPermission = {
  create: boolean;
  update: boolean;
  delete: boolean;
};
export default function UsersPage() {

  const permissions = useSelector(
    (state: RootState) => state.permission.permissions
  )

  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<{ _id: string; name: string }[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [mode, setMode] = useState<"create" | "edit" | "view">("create")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const [errors, setErrors] = useState<Partial<Record<keyof UserForm, string>>>({})

  const [userForm, setUserForm] = useState<UserForm>({
    roleName: "",
    password: "",
    confirmPassword: "",
    name: "",
    email: "",
    phone: "",
    status: "Active",
  })

  const [hasPermission, setHasPermission] = useState<UsersPermission>({
    create: false,
    update: false,
    delete: false,
  });

  useEffect(() => {
    const usersPermission = permissions.find(
      (p: Permission) => p.module === "users"
    );
  
    setHasPermission({
      create: usersPermission?.create ?? false,
      update: usersPermission?.update ?? false,
      delete: usersPermission?.delete ?? false,
    });
  }, []);

  /* ================= FETCH DATA ================= */

  useEffect(() => {
    fetchUsers()
    fetchRoles()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token') || document.cookie.split('token=')[1]?.split(';')[0]
      const response = await fetch(`${API_BASE_URL}/api/admin/users/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const result = await response.json()
      
      if (result.status) {
        const formattedUsers = result.data.map((user: any) => ({
          _id: user._id,
          roleName: user.roleName || "No Role",
          name: user.name,
          email: user.email,
          phone: user.phone || "",
          status: user.status
        }))
        setUsers(formattedUsers)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem('token') || document.cookie.split('token=')[1]?.split(';')[0]
      const response = await fetch(`${API_BASE_URL}/api/admin/roles/getRoles`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const result = await response.json()
      
      if (result.status) {
        // Super Admin should not appear in dropdown (only one super admin exists)
        const filteredRoles = (result.data || []).filter(
          (r: any) => String(r?.name || "").toLowerCase() !== "super admin"
        )
        setRoles(filteredRoles)
      }
    } catch (error) {
      console.error("Failed to fetch roles:", error)
    }
  }

  /* ================= HELPERS ================= */

  const resetForm = () => {
    setErrors({})
    setUserForm({
      roleName: "",
      password: "",
      confirmPassword: "",
      name: "",
      email: "",
      phone: "",
      status: "Active",
    })
    setSelectedUser(null)
  }

  const validateForm = () => {
    const nextErrors: Partial<Record<keyof UserForm, string>> = {}

    if (!userForm.roleName?.trim()) nextErrors.roleName = "Role is required"
    if (!userForm.name?.trim()) nextErrors.name = "Name is required"

    const email = userForm.email?.trim()
    if (!email) nextErrors.email = "Email is required"
    else if (!/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = "Invalid email"

    const phone = userForm.phone?.trim()
    if (phone && !/^\d{10}$/.test(phone)) nextErrors.phone = "Phone must be 10 digits"

    const pwd = userForm.password || ""
    const cpwd = userForm.confirmPassword || ""

    if (mode === "create") {
      if (!pwd) nextErrors.password = "Password is required"
      else if (pwd.length < 6) nextErrors.password = "Password must be at least 6 characters"

      if (!cpwd) nextErrors.confirmPassword = "Confirm Password is required"
      else if (pwd !== cpwd) nextErrors.confirmPassword = "Passwords do not match"
    }

    if (mode === "edit" && pwd) {
      if (pwd.length < 6) nextErrors.password = "Password must be at least 6 characters"
      if (!cpwd) nextErrors.confirmPassword = "Confirm Password is required"
      else if (pwd !== cpwd) nextErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  /* ================= ACTION HANDLERS ================= */

  const openCreate = () => {
    resetForm()
    setMode("create")
    setIsDialogOpen(true)
  }

  const openEdit = (user: User) => {
    setUserForm({
      roleName: user.roleName,
      password: "",
      confirmPassword: "",
      name: user.name,
      email: user.email,
      phone: user.phone,
      status: user.status,
    })
    setSelectedUser(user)
    setMode("edit")
    setIsDialogOpen(true)
  }

  const openView = (user: User) => {
    setUserForm({
      roleName: user.roleName,
      password: "",
      confirmPassword: "",
      name: user.name,
      email: user.email,
      phone: user.phone,
      status: user.status,
    })
    setSelectedUser(user)
    setMode("view")
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      if (!validateForm()) return
      const token = localStorage.getItem('token') || document.cookie.split('token=')[1]?.split(';')[0]
      
      if (mode === "create") {
        // Find roleId from roleName
        const selectedRole = roles.find(r => r.name === userForm.roleName)
        if (!selectedRole) {
          toast({
            title: "Error",
            description: "Please select a role",
            variant: "destructive",
          })
          return
        }

        const response = await fetch(`${API_BASE_URL}/api/admin/users/create`, {
          method: "POST",
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: userForm.name,
            email: userForm.email,
            password: userForm.password,
            confirmPassword: userForm.confirmPassword,
            roleId: selectedRole._id,
            phone: userForm.phone
          })
        })

        const result = await response.json()
        
        if (result.status) {
          toast({
            title: "Success",
            description: "User created successfully",
          })
          fetchUsers()
          setIsDialogOpen(false)
          resetForm()
        } else {
          toast({
            title: "Error",
            description: result.message || "Failed to create user",
            variant: "destructive",
          })
        }
      } else if (mode === "edit" && selectedUser) {
        // Find roleId from roleName
        const selectedRole = roles.find(r => r.name === userForm.roleName)
        
        const updateData: any = {
          name: userForm.name,
          email: userForm.email,
          phone: userForm.phone,
          status: userForm.status
        }

        if (selectedRole) {
          updateData.roleId = selectedRole._id
        }

        if (userForm.password) {
          updateData.password = userForm.password
          updateData.confirmPassword = userForm.confirmPassword
        }

        const response = await fetch(`${API_BASE_URL}/api/admin/users/update/${selectedUser._id}`, {
          method: "PUT",
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        })

        const result = await response.json()
        
        if (result.status) {
          toast({
            title: "Success",
            description: "User updated successfully",
          })
          fetchUsers()
          setIsDialogOpen(false)
          resetForm()
        } else {
          toast({
            title: "Error",
            description: result.message || "Failed to update user",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred",
        variant: "destructive",
      })
    }
  }

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedUser) return

    try {
      const token = localStorage.getItem('token') || document.cookie.split('token=')[1]?.split(';')[0]
      const response = await fetch(`${API_BASE_URL}/api/admin/users/delete/${selectedUser._id}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()
      
      if (result.status) {
        toast({
          title: "Success",
          description: "User deleted successfully",
        })
        setIsDeleteDialogOpen(false)
        setSelectedUser(null)
        fetchUsers()
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to delete user",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      })
    }
  }

  /* ================= UI ================= */

  const isViewMode = mode === "view"
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.trim().toLowerCase()
    const matchesQuery =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone || "").toLowerCase().includes(q) ||
      (u.roleName || "").toLowerCase().includes(q)

    const matchesStatus = statusFilter === "all" || u.status === statusFilter
    return matchesQuery && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users Management</h1>
          <p className="text-muted-foreground">
            Manage Admins, Captains, Vendors & Roles
          </p>
        </div>
        {hasPermission.create && <Button onClick={openCreate}>Create User</Button>}
      </div>

      {/* Search + Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by role, name, email, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6 overflow-x-auto">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No users found</div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted/60 border-b">
                  <th className="p-4 text-left">Role</th>
                  <th className="p-4 text-left">Name</th>
                  <th className="p-4 text-left">Email</th>
                  <th className="p-4 text-left">Phone</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr
                    key={user._id}
                    className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}
                  >
                    <td className="p-4 font-medium">{user.roleName}</td>
                    <td className="p-4">{user.name}</td>
                    <td className="p-4">{user.email}</td>
                    <td className="p-4">{user.phone}</td>
                    <td className="p-4">
                      <Badge
                        variant={
                          user.status === "Active"
                            ? "default"
                            : "destructive"
                        }
                      >
                        {user.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openView(user)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                   {hasPermission.update &&     <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEdit(user)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>}
                        {hasPermission.delete && user.roleName !== "Super Admin" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteClick(user)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {mode === "view"
                ? "View User"
                : mode === "edit"
                ? "Edit User"
                : "Create User"}
            </DialogTitle>
            <DialogDescription>
              User basic information and role assignment
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Role */}
            <div>
              <Label>Role Name</Label>
              <Select
                disabled={isViewMode}
                value={userForm.roleName}
                onValueChange={(value) => {
                  setUserForm({ ...userForm, roleName: value })
                  setErrors((prev) => ({ ...prev, roleName: "" }))
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role._id} value={role.name}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!!errors.roleName && <p className="text-sm text-red-600 mt-1">{errors.roleName}</p>}
            </div>

            {/* Password - Only show in create mode */}
        

            {/* Name */}
            <div>
              <Label>Name</Label>
              <Input
                disabled={isViewMode}
                value={userForm.name}
                onChange={(e) =>
                  setUserForm({ ...userForm, name: e.target.value })
                }
              />
              {!!errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <Label>Email</Label>
              <Input
                disabled={isViewMode}
                value={userForm.email}
                onChange={(e) =>
                  setUserForm({ ...userForm, email: e.target.value })
                }
              />
              {!!errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <Label>Phone</Label>
              <Input
                disabled={isViewMode}
                value={userForm.phone}
                onChange={(e) =>
                  setUserForm({ ...userForm, phone: e.target.value })
                }
              />
              {!!errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
            </div>

            {/* Password - Show in create and edit mode */}
            {(mode === "create" || mode === "edit") && (
              <>
                <div>
                  <Label>Password</Label>
                  <Input
                    type="password"
                    disabled={isViewMode}
                    value={userForm.password}
                    onChange={(e) =>
                      setUserForm({ ...userForm, password: e.target.value })
                    }
                    placeholder={mode === "create" ? "Enter password" : "Enter new password"}
                  />
                  {!!errors.password && <p className="text-sm text-red-600 mt-1">{errors.password}</p>}
                </div>

                {mode === "create" && (
                  <div>
                    <Label>Confirm Password</Label>
                    <Input
                      type="password"
                      disabled={isViewMode}
                      value={userForm.confirmPassword}
                      onChange={(e) =>
                        setUserForm({ ...userForm, confirmPassword: e.target.value })
                      }
                      placeholder="Confirm password"
                    />
                    {!!errors.confirmPassword && <p className="text-sm text-red-600 mt-1">{errors.confirmPassword}</p>}
                  </div>
                )}
                {mode === "edit"  && (
                  <div>
                    <Label>Confirm Password</Label>
                    <Input
                      type="password"
                      disabled={isViewMode}
                      value={userForm.confirmPassword}
                      onChange={(e) =>
                        setUserForm({ ...userForm, confirmPassword: e.target.value })
                      }
                      placeholder="Confirm password"
                    />
                    {!!errors.confirmPassword && <p className="text-sm text-red-600 mt-1">{errors.confirmPassword}</p>}
                  </div>
                )}
              </>
            )}

            {/* Status - Only show in edit/view mode (Super Admin हमेशा Active रहेगा) */}
            {mode !== "create" && userForm.roleName !== "Super Admin" && (
              <div>
                <Label>Status</Label>
                <Select
                  disabled={isViewMode}
                  value={userForm.status}
                  onValueChange={(value) =>
                    setUserForm({
                      ...userForm,
                      status: value as Status,
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {mode !== "view" && (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {mode === "edit" ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedUser?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
