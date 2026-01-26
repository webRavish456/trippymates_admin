// redux/store.ts
import { createStore, combineReducers } from "redux"
import { permissionReducer } from "./reducer"

const rootReducer = combineReducers({
  permission: permissionReducer,
})

// Load persisted state from localStorage
const loadState = () => {
  try {
    const serializedState = localStorage.getItem('redux_state')
    if (serializedState === null) return undefined
    return JSON.parse(serializedState)
  } catch {
    return undefined
  }
}

// Save state to localStorage
const saveState = (state: ReturnType<typeof rootReducer>) => {
  try {
    localStorage.setItem('redux_state', JSON.stringify(state))
  } catch {
    // Ignore errors
  }
}

const persistedState = loadState()
export const store = createStore(rootReducer, persistedState)

// Subscribe to store changes and save to localStorage
store.subscribe(() => {
  saveState(store.getState())
})

export type RootState = ReturnType<typeof rootReducer>
