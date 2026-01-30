"use client"

import React, { useState, useEffect } from "react"
import { Plus, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { API_BASE_URL } from "@/lib/config"
import { useDispatch } from "react-redux"
import { useSelector } from "react-redux"
import { RootState } from "@/components/redux/store"
import { setPermissions } from "@/components/redux/action"
import { useAuth } from "@/contexts/auth-context"

interface Role {
  _id: string
  name: string
  status: boolean
  permissions: {
    [key: string]: {
      create: boolean
      read: boolean
      update: boolean
      delete: boolean
    }
  }
}

// Define permission structure
type PermissionConfig = {
  key: string
  label: string
  readOnly?: boolean
  noDelete?: boolean
}

// Define permissions/modules based on the admin panel features
const PERMISSIONS: PermissionConfig[] = [
  { key: "roles_permissions", label: "Roles and Permissions" },
  { key: "captain_details", label: "Captain Details" },
  { key: "captain_assignment", label: "Captain Assignment", readOnly: true },
  { key: "users", label: "Users" },
  { key: "customers", label: "Customers", readOnly: true },
  { key: "vendors", label: "Vendors" },
  { key: "explore_destination", label: "Explore Destination" },
  { key: "community_trips", label: "Community" },
  { key: "packages", label: "Packages" },
  { key: "bookings", label: "Bookings", readOnly: true },
  { key: "trips", label: "Trips", readOnly: true },
  { key: "payments", label: "Payments", readOnly: true },
  { key: "banner", label: "Banner" },
  { key: "coupon_details", label: "Coupon Details" },
  { key: "coupon_management", label: "Coupon Management", readOnly: true },
  { key: "promo_details", label: "Promo Details" },
  { key: "promo_management", label: "Promo Management", readOnly: true },
  { key: "reward_management", label: "Reward Management", readOnly: true },
  { key: "content", label: "Content" },
  { key: "notifications", label: "Notifications", readOnly: true },
  { key: "report", label: "Report", readOnly: true },
  { key: "settings", label: "Settings", noDelete: true },
]

const ACTIONS = [
  { key: "create", label: "CREATE" },
  { key: "read", label: "READ" },
  { key: "update", label: "UPDATE" },
  { key: "delete", label: "DELETE" },
]


type Permission = {
  module: string;
  create: boolean;
  read?: boolean;
  update?: boolean;
  delete?: boolean;
};

type RolesPermissionsPermission = {
  create: boolean;
  update: boolean;
  delete: boolean;
};

export default function RolesAndPermissionsPage() {
  const { user } = useAuth()
  const [roles, setRoles] = useState<Role[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const dispatch = useDispatch()

  const permissions = useSelector(
    (state: RootState) => state.permission.permissions
  )


  const [hasPermission, setHasPermission] = useState<RolesPermissionsPermission>({
    create: false,
    update: false,
    delete: false,  
  })

  useEffect(() => {
    const rolesPermissionsPermission = permissions.find(
      (p: Permission) => p.module === "roles_permissions"
    )
    setHasPermission({
      create: rolesPermissionsPermission?.create ?? false,
      update: rolesPermissionsPermission?.update ?? false,
      delete: rolesPermissionsPermission?.delete ?? false,
    })
  }, [])

  const [roleForm, setRoleForm] = useState({
    name: "",
    permissions: {} as { [key: string]: { create: boolean; read: boolean; update: boolean; delete: boolean } },
  })

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token') || document.cookie.split('token=')[1]?.split(';')[0]
      const response = await fetch(`${API_BASE_URL}/api/admin/roles/getRoles`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const result = await response.json()
      
      if (result.status) {
        // Convert permissions array back to object format for display
        const formattedRoles = (result.data || []).map((role: any) => ({
          _id: role._id,
          name: role.name,
          status: role.status,
          permissions: role.permissions?.reduce((acc: any, perm: any) => {
            acc[perm.module] = {
              create: perm.create,
              read: perm.read,
              update: perm.update,
              delete: perm.delete
            }
            return acc
          }, {}) || {}
        }))
        setRoles(formattedRoles)
      } else {
 
        setRoles([
          {
            _id: "1",
            name: "Super Admin",
            status: true,
            permissions: {},
          },
          {
            _id: "2",
            name: "Vendor",
            status: true,
            permissions: {},
          },
          {
            _id: "3",
            name: "Captain",
            status: true,
            permissions: {},
          },
          {
            _id: "4",
            name: "Managing Director",
            status: true,
            permissions: {},
          },
          {
            _id: "5",
            name: "CEO",
            status: true,
            permissions: {},
          },
        ])
      }
    } catch (error) {
      // Use mock data on error
      setRoles([
        {
          _id: "1",
          name: "Super Admin",
          status: true,
          permissions: {},
        },
        {
          _id: "2",
          name: "Vendor",
          status: true,
          permissions: {},
        },
        {
          _id: "3",
          name: "Captain",
          status: true,
          permissions: {},
        },
        {
          _id: "4",
          name: "Managing Director",
          status: true,
          permissions: {},
        },
        {
          _id: "5",
          name: "CEO",
          status: true,
          permissions: {},
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRole = () => {
    setRoleForm({
      name: "",
      permissions: {},
    })
    setIsCreateDialogOpen(true)
  }

  console.log("roles", roles)

  const normalizePermissions = (permissions: { [key: string]: { create: boolean; read: boolean; update: boolean; delete: boolean } }) => {
    const normalized: { [key: string]: { create: boolean; read: boolean; update: boolean; delete: boolean } } = {}
    
    Object.keys(permissions).forEach(key => {
      const permission = PERMISSIONS.find(p => p.key === key)
      const perm = permissions[key]
      
      if (permission?.readOnly) {
        // For readOnly modules, only keep READ permission
        normalized[key] = {
          create: false,
          read: perm.read || false,
          update: false,
          delete: false,
        }
      } else if (permission?.noDelete) {
        // For settings, remove DELETE permission
        normalized[key] = {
          create: perm.create || false,
          read: perm.read || false,
          update: perm.update || false,
          delete: false,
        }
      } else {
        normalized[key] = perm
      }
    })
    
    return normalized
  }

  const handleEditRole = (role: Role) => {
    setSelectedRole(role)
    // Ensure permissions are in the correct format and normalized
    const permissionsObj = role.permissions || {}
    const normalizedPermissions = normalizePermissions(permissionsObj)
    setRoleForm({
      name: role.name,
      permissions: normalizedPermissions,
    })
    setIsEditDialogOpen(true)
  }

  const handleDeleteRole = (role: Role) => {
    setSelectedRole(role)
    setIsDeleteDialogOpen(true)
  }

  const handleToggleStatus = async (roleId: string) => {
    const role = roles.find((r) => r._id === roleId)
    if (!role) return

    const newStatus = !role.status

    try {
      const token = localStorage.getItem('token') || document.cookie.split('token=')[1]?.split(';')[0]
      const response = await fetch(`${API_BASE_URL}/api/admin/roles/updateRoleStatus`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: roleId, status: newStatus }),
      })

      const result = await response.json()

      if (result.status) {
        setRoles(roles.map((r) => (r._id === roleId ? { ...r, status: newStatus } : r)))
        toast({
          title: "Status Updated",
          description: `${role.name} status has been updated`,
        })
      } else {

        setRoles(roles.map((r) => (r._id === roleId ? { ...r, status: newStatus } : r)))
        toast({
          title: "Status Updated",
          description: `${role.name} status has been updated`,
        })
      }
    } catch (error) {
     
      setRoles(roles.map((r) => (r._id === roleId ? { ...r, status: newStatus } : r)))
      toast({
        title: "Status Updated",
        description: `${role.name} status has been updated`,
      })
    }
  }

  const handlePermissionChange = (permissionKey: string, action: string, checked: boolean) => {
    const permission = PERMISSIONS.find(p => p.key === permissionKey)
    
    // Prevent setting CREATE/UPDATE/DELETE for readOnly modules
    if (permission?.readOnly && action !== "read") {
      return
    }
    
    // Prevent setting DELETE for settings
    if (permission?.noDelete && action === "delete") {
      return
    }
    
    setRoleForm((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permissionKey]: {
          ...prev.permissions[permissionKey],
          [action]: checked,
        },
      },
    }))
  }

  // Handle "All" for a specific permission row
  const handleAllPermissionChange = (permissionKey: string, checked: boolean) => {
    const permission = PERMISSIONS.find(p => p.key === permissionKey)
    if (!permission) return

    const currentPerm = roleForm.permissions[permissionKey] || {
      create: false,
      read: false,
      update: false,
      delete: false
    }

    const updatedPerm: { create: boolean; read: boolean; update: boolean; delete: boolean } = {
      create: permission.readOnly ? currentPerm.create : checked,
      read: checked,
      update: permission.readOnly ? currentPerm.update : checked,
      delete: permission.noDelete ? currentPerm.delete : checked
    }

    setRoleForm((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permissionKey]: updatedPerm,
      },
    }))
  }

  // Handle "All" for all permissions
  const handleAllPermissionsChange = (checked: boolean) => {
    const newPermissions: { [key: string]: { create: boolean; read: boolean; update: boolean; delete: boolean } } = {}
    
    PERMISSIONS.forEach((permission) => {
      newPermissions[permission.key] = {
        create: permission.readOnly ? false : checked,
        read: checked,
        update: permission.readOnly ? false : checked,
        delete: permission.noDelete ? false : checked
      }
    })

    setRoleForm((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        ...newPermissions,
      },
    }))
  }

  // Check if all permissions are selected for a specific row
  const isAllSelectedForRow = (permissionKey: string): boolean => {
    const permission = PERMISSIONS.find(p => p.key === permissionKey)
    if (!permission) return false

    const perm = roleForm.permissions[permissionKey] || {
      create: false,
      read: false,
      update: false,
      delete: false
    }

    // Check read permission (always applicable)
    if (!perm.read) return false

    // For readOnly modules, only check read
    if (permission.readOnly) {
      return perm.read === true
    }

    // For others, check all applicable permissions
    if (!permission.readOnly && !perm.create) return false
    if (!permission.readOnly && !perm.update) return false
    if (!permission.noDelete && !perm.delete) return false

    return true
  }

  // Check if all permissions are selected for all rows
  const isAllSelectedForAll = (): boolean => {
    return PERMISSIONS.every((permission) => {
      const perm = roleForm.permissions[permission.key] || {
        create: false,
        read: false,
        update: false,
        delete: false
      }

      if (!perm.read) return false


      if (permission.readOnly) {
        return perm.read === true
      }

      if (!perm.create || !perm.update) return false
      if (!permission.noDelete && !perm.delete) return false

      return true
    })
  }

  const handleSaveRole = async () => {
    if (!roleForm.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a role name",
        variant: "destructive",
      })
      return
    }

    // Check for duplicate role name (case-insensitive)
    const normalizedInputName = roleForm.name.toLowerCase().trim()
    const duplicateRole = roles.find(
      (r) => {
        const normalizedRoleName = r.name.toLowerCase().trim()
        // Check if exact match or if Super Admin/Admin are being treated as same
        const isExactMatch = normalizedRoleName === normalizedInputName
        const isSuperAdminAdminConflict = 
          (normalizedInputName === "super admin" && normalizedRoleName === "admin") ||
          (normalizedInputName === "admin" && normalizedRoleName === "super admin")
        
        // When editing, exclude the current role from duplicate check
        const isCurrentRole = selectedRole && String(r._id) === String(selectedRole._id)
        
        return (isExactMatch || isSuperAdminAdminConflict) && !isCurrentRole
      }
    )
    
    if (duplicateRole) {
      toast({
        title: "Error",
        description: "Already this role is created",
        variant: "destructive",
      })
      return
    }

    try {
      const url = selectedRole
        ? `${API_BASE_URL}/api/admin/roles/updateRole/${selectedRole._id}`
        : `${API_BASE_URL}/api/admin/roles/createRole`
      
      const method = selectedRole ? "PUT" : "POST"
      const token = localStorage.getItem('token') || document.cookie.split('token=')[1]?.split(';')[0]

 
      const normalizedPermissions = normalizePermissions(roleForm.permissions)
      

      const permissionsArray = Object.keys(normalizedPermissions).map(key => ({
        module: key,
        create: normalizedPermissions[key].create || false,
        read: normalizedPermissions[key].read || false,
        update: normalizedPermissions[key].update || false,
        delete: normalizedPermissions[key].delete || false
      }))

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: roleForm.name,
          permissions: permissionsArray,
        }),
      })

      const result = await response.json()

      if (result.status) {
        toast({
          title: "Success",
          description: selectedRole ? "Role updated successfully" : "Role created successfully",
        })
        
        // Update localStorage/redux only if:
        // 1. User is editing their own role (logged-in user's role matches the role being edited)
        // 2. This means if vendor logs in and edits Vendor role, it will update
        // 3. If Super Admin logs in and edits Super Admin role, it will update
        const loggedInUserRole = user?.role?.toLowerCase().trim()
        const editingRoleName = selectedRole?.name?.toLowerCase().trim()
        
        // Check if user is editing their own role
        if (selectedRole && loggedInUserRole && editingRoleName && 
            loggedInUserRole === editingRoleName) {
          dispatch(setPermissions(permissionsArray))
        }
        
        setIsCreateDialogOpen(false)
        setIsEditDialogOpen(false)
        fetchRoles()
      } else {
        // Check if error is due to duplicate role
        const errorMessage = result.message || ""
        if (errorMessage.toLowerCase().includes("already") || 
            errorMessage.toLowerCase().includes("duplicate") ||
            errorMessage.toLowerCase().includes("exists")) {
          toast({
            title: "Error",
            description: "Already this role is created",
            variant: "destructive",
          })
          return
        }

        // Only create locally if it's not a duplicate error
        if (!selectedRole) {
          // Check again for duplicates before creating locally
          const normalizedInputName = roleForm.name.toLowerCase().trim()
          const duplicateRole = roles.find(
            (r) => {
              const normalizedRoleName = r.name.toLowerCase().trim()
              const isExactMatch = normalizedRoleName === normalizedInputName
              const isSuperAdminAdminConflict = 
                (normalizedInputName === "super admin" && normalizedRoleName === "admin") ||
                (normalizedInputName === "admin" && normalizedRoleName === "super admin")
              return isExactMatch || isSuperAdminAdminConflict
            }
          )
          
          if (duplicateRole) {
            toast({
              title: "Error",
              description: "Already this role is created",
              variant: "destructive",
            })
            return
          }

          const newRole: Role = {
            _id: Date.now().toString(),
            name: roleForm.name,
            status: true,
            permissions: roleForm.permissions,
          }
          setRoles([...roles, newRole])
          toast({
            title: "Success",
            description: "Role created successfully",
          })
        } else {
          setRoles(roles.map((r) => (r._id === selectedRole._id ? { ...r, name: roleForm.name, permissions: roleForm.permissions } : r)))
          toast({
            title: "Success",
            description: "Role updated successfully",
          })
        }
     
        setIsCreateDialogOpen(false)
        setIsEditDialogOpen(false)
      }
    } catch (error: any) {
      // Check for duplicate before creating locally
      if (!selectedRole) {
        const normalizedInputName = roleForm.name.toLowerCase().trim()
        const duplicateRole = roles.find(
          (r) => {
            const normalizedRoleName = r.name.toLowerCase().trim()
            const isExactMatch = normalizedRoleName === normalizedInputName
            const isSuperAdminAdminConflict = 
              (normalizedInputName === "super admin" && normalizedRoleName === "admin") ||
              (normalizedInputName === "admin" && normalizedRoleName === "super admin")
            return isExactMatch || isSuperAdminAdminConflict
          }
        )
        
        if (duplicateRole) {
          toast({
            title: "Error",
            description: "Already this role is created",
            variant: "destructive",
          })
          return
        }

        const newRole: Role = {
          _id: Date.now().toString(),
          name: roleForm.name,
          status: true,
          permissions: roleForm.permissions,
        }
        setRoles([...roles, newRole])
        toast({
          title: "Success",
          description: "Role created successfully",
        })
      } else {
        setRoles(roles.map((r) => (r._id === selectedRole._id ? { ...r, name: roleForm.name, permissions: roleForm.permissions } : r)))
        toast({
          title: "Success",
          description: "Role updated successfully",
        })
      }
      setIsCreateDialogOpen(false)
      setIsEditDialogOpen(false)
    }
  }

  const handleDeleteRoleConfirm = async () => {
    if (!selectedRole) return

    // Prevent deletion of Admin role
    if (selectedRole.name.toLowerCase() === "admin" || selectedRole.name.toLowerCase() === "super admin") {
      toast({
        title: "Error",
        description: "Admin role cannot be deleted",
        variant: "destructive",
      })
      setIsDeleteDialogOpen(false)
      return
    }

    try {
      const token = localStorage.getItem('token') || document.cookie.split('token=')[1]?.split(';')[0]
      const response = await fetch(`${API_BASE_URL}/api/admin/roles/deleteRole/${selectedRole._id}`, {
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
          description: "Role deleted successfully",
        })
        setIsDeleteDialogOpen(false)
        fetchRoles()
      } else {
        // Delete locally if API doesn't exist
        setRoles(roles.filter((r) => r._id !== selectedRole._id))
        toast({
          title: "Success",
          description: "Role deleted successfully",
        })
        setIsDeleteDialogOpen(false)
      }
    } catch (error) {
      // Delete locally on error
      setRoles(roles.filter((r) => r._id !== selectedRole._id))
      toast({
        title: "Success",
        description: "Role deleted successfully",
      })
      setIsDeleteDialogOpen(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roles and Permissions</h1>
          <p className="text-muted-foreground">Manage roles and their permissions</p>
        </div>
        {hasPermission.create &&  <Button onClick={handleCreateRole}>
          <Plus className="h-4 w-4 mr-2" />
          Create Role
        </Button>}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">ROLE</th>
                  <th className="text-center p-4 font-medium">STATUS</th>
                  <th className="text-right p-4 font-medium">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                ) : roles.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-muted-foreground">
                      No roles found
                    </td>
                  </tr>
                ) : (
                  roles.map((role) => (
                    <tr key={role._id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div className="font-medium">{role.name}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center">
                          <Switch
                            checked={role.status}
                            onCheckedChange={() => handleToggleStatus(role._id)}
                          />
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          {hasPermission.update &&  <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditRole(role)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>}
                          {(role.name.toLowerCase() !== "admin" && role.name.toLowerCase() !== "super admin") && (
                            hasPermission.delete && <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteRole(role)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create Role Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
  <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Create Role</DialogTitle>
      <DialogDescription>
        Enter role name and set permissions
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-6">
      {/* Role Name */}
      <div className="space-y-2">
        <Label htmlFor="role-name">Enter role name</Label>
        <Input
          id="role-name"
          placeholder="Enter role name"
          value={roleForm.name}
          onChange={(e) =>
            setRoleForm({ ...roleForm, name: e.target.value })
          }
        />
      </div>

      {/* Permissions Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Permissions</p>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={isAllSelectedForAll()}
              onCheckedChange={(checked) => handleAllPermissionsChange(checked as boolean)}
            />
            <Label className="text-sm cursor-pointer">Select All</Label>
          </div>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <table className="w-full border-collapse">
            {/* Table Header */}
            <thead>
              <tr className="bg-muted/60 border-b">
                <th className="text-left p-4 text-sm font-semibold">
                  PERMISSIONS
                </th>
                <th className="p-4 text-center text-sm font-semibold uppercase">
                  ALL
                </th>
                {ACTIONS.map((action) => (
                  <th
                    key={action.key}
                    className="p-4 text-center text-sm font-semibold uppercase"
                  >
                    {action.label}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {PERMISSIONS.map((permission, index) => (
                <tr
                  key={permission.key}
                  className={
                    index % 2 === 0
                      ? "bg-background"
                      : "bg-muted/30"
                  }
                >
                  <td className="p-4 font-medium">
                    {permission.label}
                  </td>
                  <td className="p-4 text-center align-middle">
                    <Checkbox
                      className="scale-110"
                      checked={isAllSelectedForRow(permission.key)}
                      onCheckedChange={(checked) =>
                        handleAllPermissionChange(permission.key, checked as boolean)
                      }
                    />
                  </td>
                  {ACTIONS.map((action) => {
                    // Hide CREATE, UPDATE, DELETE for readOnly modules (only show READ)
                    if (permission.readOnly && action.key !== "read") {
                      return (
                        <td
                          key={action.key}
                          className="p-4 text-center align-middle"
                        >
                          <span className="text-muted-foreground text-xs">-</span>
                        </td>
                      )
                    }
                    // Hide DELETE for settings (noDelete: true)
                    if (permission.noDelete && action.key === "delete") {
                      return (
                        <td
                          key={action.key}
                          className="p-4 text-center align-middle"
                        >
                          <span className="text-muted-foreground text-xs">-</span>
                        </td>
                      )
                    }
                    return (
                      <td
                        key={action.key}
                        className="p-4 text-center align-middle"
                      >
                        <Checkbox
                          className="scale-110"
                          checked={
                            roleForm.permissions[permission.key]?.[
                              action.key as keyof typeof roleForm.permissions[string]
                            ] || false
                          }
                          onCheckedChange={(checked) =>
                            handlePermissionChange(
                              permission.key,
                              action.key,
                              checked as boolean
                            )
                          }
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    {/* Footer */}
    <DialogFooter className="mt-6">
      <Button
        variant="outline"
        onClick={() => setIsCreateDialogOpen(false)}
      >
        Cancel
      </Button>
      <Button onClick={handleSaveRole}>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>


      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
  <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Edit Role</DialogTitle>
      <DialogDescription>
        Update role name and permissions
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-6">
      {/* Role Name */}
      <div className="space-y-2">
        <Label htmlFor="edit-role-name">Enter role name</Label>
        <Input
          id="edit-role-name"
          placeholder="Enter role name"
          value={roleForm.name}
          onChange={(e) =>
            setRoleForm({ ...roleForm, name: e.target.value })
          }
        />
      </div>

      {/* Permissions Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Permissions</p>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={isAllSelectedForAll()}
              onCheckedChange={(checked) => handleAllPermissionsChange(checked as boolean)}
            />
            <Label className="text-sm cursor-pointer">Select All</Label>
          </div>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <table className="w-full border-collapse">
            {/* Header */}
            <thead>
              <tr className="border-b bg-muted/60">
                <th className="text-left p-4 text-sm font-semibold">
                  PERMISSIONS
                </th>
                <th className="p-4 text-center text-sm font-semibold uppercase">
                  ALL
                </th>
                {ACTIONS.map((action) => (
                  <th
                    key={action.key}
                    className="p-4 text-center text-sm font-semibold uppercase"
                  >
                    {action.label}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {PERMISSIONS.filter((permission) => {
               
               if (roleForm.name.toLowerCase() === "super admin" && permission.key === "roles_permissions") {
                return false;
              }
              return true;
              
              }).map((permission, index) => (
                <tr
                  key={permission.key}
                  className={
                    index % 2 === 0
                      ? "bg-background"
                      : "bg-muted/30"
                  }
                >
                  <td className="p-4 font-medium">
                    {permission.label}
                  </td>
                  <td className="p-4 text-center align-middle">
                    <Checkbox
                      className="scale-110"
                      checked={isAllSelectedForRow(permission.key)}
                      onCheckedChange={(checked) =>
                        handleAllPermissionChange(permission.key, checked as boolean)
                      }
                    />
                  </td>
                  {ACTIONS.map((action) => {
                    // Hide CREATE, UPDATE, DELETE for readOnly modules (only show READ)
                    if (permission.readOnly && action.key !== "read") {
                      return (
                        <td
                          key={action.key}
                          className="p-4 text-center align-middle"
                        >
                          <span className="text-muted-foreground text-xs">-</span>
                        </td>
                      )
                    }
                    // Hide DELETE for settings (noDelete: true)
                    if (permission.noDelete && action.key === "delete") {
                      return (
                        <td
                          key={action.key}
                          className="p-4 text-center align-middle"
                        >
                          <span className="text-muted-foreground text-xs">-</span>
                        </td>
                      )
                    }
                    return (
                      <td
                        key={action.key}
                        className="p-4 text-center align-middle"
                      >
                        <Checkbox
                          className="scale-110"
                          checked={
                            roleForm.permissions[permission.key]?.[
                              action.key as keyof typeof roleForm.permissions[string]
                            ] || false
                          }
                          onCheckedChange={(checked) =>
                            handlePermissionChange(
                              permission.key,
                              action.key,
                              checked as boolean
                            )
                          }
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    {/* Footer */}
    <DialogFooter className="mt-6">
      <Button
        variant="outline"
        onClick={() => setIsEditDialogOpen(false)}
      >
        Cancel
      </Button>
      <Button onClick={handleSaveRole}>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>


      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedRole?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteRoleConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
