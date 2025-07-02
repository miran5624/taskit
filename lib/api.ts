"use client"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

class ApiClient {
  private getAuthHeaders() {
    const token = localStorage.getItem("authToken")
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`

    const config: RequestInit = {
      headers: this.getAuthHeaders(),
      ...options,
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "API request failed")
      }

      return data
    } catch (error) {
      console.error("API request error:", error)
      throw error
    }
  }

  // Auth endpoints
  async register(userData: { email: string; password: string; teamName?: string }) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  }

  async login(credentials: { email: string; password: string }) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    })
  }

  async getCurrentUser() {
    return this.request("/auth/me")
  }

  // Task endpoints
  async getTasks(filter?: string) {
    const queryParam = filter ? `?filter=${filter}` : ""
    return this.request(`/tasks${queryParam}`)
  }

  async createTask(taskData: {
    title: string
    description: string
    dueDate: string
    priority: string
    assigneeIds: number[]
  }) {
    return this.request("/tasks", {
      method: "POST",
      body: JSON.stringify(taskData),
    })
  }

  async updateTask(taskId: string, updates: any) {
    return this.request(`/tasks/${taskId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    })
  }

  async deleteTask(taskId: string) {
    return this.request(`/tasks/${taskId}`, {
      method: "DELETE",
    })
  }

  // User endpoints
  async getTeamMembers() {
    return this.request("/users/team-members")
  }

  async getMyTeams() {
    return this.request("/users/teams")
  }

  async getTeamMembersById(teamId: number) {
    return this.request(`/users/teams/${teamId}/members`)
  }
}

export const apiClient = new ApiClient()
