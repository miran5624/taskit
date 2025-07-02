"use client"

import { configureStore, createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { apiClient } from "./api"

export interface Task {
  id: string
  title: string
  description: string
  dueDate: string
  priority: "Low" | "Medium" | "High"
  status: "To Do" | "In Progress" | "Done"
  assignees: { id: number; email: string }[]
  createdBy: number
  createdByEmail: string
  createdAt: string
  updatedAt: string
}

export interface User {
  id: number
  email: string
  teamName: string
}

export interface TeamMember {
  id: number
  email: string
  teamName: string
}

interface AppState {
  user: User | null
  tasks: Task[]
  teamMembers: TeamMember[]
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

const initialState: AppState = {
  user: null,
  tasks: [],
  teamMembers: [],
  isAuthenticated: false,
  loading: false,
  error: null,
}

// Async thunks
export const loginUser = createAsyncThunk(
  "app/loginUser",
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.login(credentials)
      localStorage.setItem("authToken", response.token)
      return response.user
    } catch (error: any) {
      return rejectWithValue(error.message || "Login failed")
    }
  },
)

export const registerUser = createAsyncThunk(
  "app/registerUser",
  async (userData: { email: string; password: string; teamName?: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.register(userData)
      localStorage.setItem("authToken", response.token)
      return response.user
    } catch (error: any) {
      return rejectWithValue(error.message || "Registration failed")
    }
  },
)

export const fetchCurrentUser = createAsyncThunk("app/fetchCurrentUser", async (_, { rejectWithValue }) => {
  try {
    const response = await apiClient.getCurrentUser()
    return response.user
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch user")
  }
})

export const fetchTasks = createAsyncThunk("app/fetchTasks", async (filter: string | undefined, { rejectWithValue }) => {
  try {
    const response = await apiClient.getTasks(filter)
    return response.tasks
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch tasks")
  }
})

export const createTask = createAsyncThunk(
  "app/createTask",
  async (
    taskData: {
      title: string
      description: string
      dueDate: string
      priority: string
      assigneeIds: number[]
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await apiClient.createTask(taskData)
      return response.task
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create task")
    }
  },
)

export const updateTask = createAsyncThunk(
  "app/updateTask",
  async ({ taskId, updates }: { taskId: string; updates: any }, { rejectWithValue }) => {
    try {
      const response = await apiClient.updateTask(taskId, updates)
      return response.task
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update task")
    }
  },
)

export const deleteTask = createAsyncThunk("app/deleteTask", async (taskId: string, { rejectWithValue }) => {
  try {
    await apiClient.deleteTask(taskId)
    return taskId
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to delete task")
  }
})

export const fetchTeamMembers = createAsyncThunk("app/fetchTeamMembers", async (_, { rejectWithValue }) => {
  try {
    const response = await apiClient.getTeamMembers()
    return response.teamMembers
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch team members")
  }
})

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null
      state.isAuthenticated = false
      state.tasks = []
      state.teamMembers = []
      state.error = null
      localStorage.removeItem("authToken")
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
        state.isAuthenticated = false
      })

      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
        state.isAuthenticated = false
      })

      // Fetch current user
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.loading = false
        state.isAuthenticated = false
        localStorage.removeItem("authToken")
      })

      // Fetch tasks
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false
        state.tasks = action.payload
        state.error = null
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // Create task
      .addCase(createTask.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.loading = false
        state.tasks.unshift(action.payload)
        state.error = null
      })
      .addCase(createTask.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // Update task
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex((task) => task.id === action.payload.id)
        if (index !== -1) {
          state.tasks[index] = action.payload
        }
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.error = action.payload as string
      })

      // Delete task
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter((task) => task.id !== action.payload)
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.error = action.payload as string
      })

      // Fetch team members
      .addCase(fetchTeamMembers.fulfilled, (state, action) => {
        state.teamMembers = action.payload
      })
      .addCase(fetchTeamMembers.rejected, (state, action) => {
        state.error = action.payload as string
      })
  },
})

export const { logout, clearError } = appSlice.actions

export const store = configureStore({
  reducer: {
    app: appSlice.reducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
