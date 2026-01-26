// redux/actions.ts
export type Permission = {
    module: string
    create: boolean
    read: boolean
    update: boolean
    delete: boolean
  }

export const SET_PERMISSIONS = "SET_PERMISSIONS"
export const CLEAR_PERMISSIONS = "CLEAR_PERMISSIONS"

export const setPermissions = (permissions: Permission[]) => ({
  type: SET_PERMISSIONS,
  payload: permissions,
})

export const clearPermissions = () => ({
  type: CLEAR_PERMISSIONS,
})
