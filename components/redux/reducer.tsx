// redux/reducer.ts
import { SET_PERMISSIONS, CLEAR_PERMISSIONS } from "@/components/redux/action"


export type Permission = {
    module: string
    create: boolean
    read: boolean
    update: boolean
    delete: boolean
  }

type PermissionState = {
  permissions: Permission[]
}

const initialState: PermissionState = {
  permissions: [],
}

type Action = {
  type: string
  payload?: Permission[]
}

export const permissionReducer = (
  state = initialState,
  action: Action
): PermissionState => {
  switch (action.type) {
    case SET_PERMISSIONS:
      return { ...state, permissions: action.payload || [] }

    case CLEAR_PERMISSIONS:
      return { ...state, permissions: [] }

    default:
      return state
  }
}
