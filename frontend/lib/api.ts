const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://hostel-management-system-production-5590.up.railway.app/api/v1"

export interface User {
  id: number
  name: string
  email: string
  phone_number?: string
  role: "student" | "officer" | "manager" | "admin"
  created_at: string
  updated_at: string
}

export interface MaintenanceRequest {
  issue_ID: number
  student_ID: number
  room_ID: number
  category_ID: number
  status_ID: number
  description: string
  availability?: string
  submission_timestamp: string
  last_updated: string
  completion_timestamp?: string
  estimated_cost?: number
  actual_cost?: number
}

export interface ApiResponse<T> {
  data: T
  message?: string
}

class ApiClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("API request failed:", error)
      throw error
    }
  }

  // User endpoints
  async getUsers(params?: { skip?: number; limit?: number; role?: string }): Promise<User[]> {
    const searchParams = new URLSearchParams()
    if (params?.skip) searchParams.append("skip", params.skip.toString())
    if (params?.limit) searchParams.append("limit", params.limit.toString())
    if (params?.role) searchParams.append("role", params.role)

    const query = searchParams.toString()
    return this.request<User[]>(`/users${query ? `?${query}` : ""}`)
  }

  async getUser(userId: number): Promise<User> {
    return this.request<User>(`/users/${userId}`)
  }

  async createUser(userData: Omit<User, "id" | "created_at" | "updated_at">): Promise<User> {
    return this.request<User>("/users", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  }

  async updateUser(userId: number, userData: Partial<User>): Promise<User> {
    return this.request<User>(`/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    })
  }

  async deleteUser(userId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/users/${userId}`, {
      method: "DELETE",
    })
  }

  // Maintenance Request endpoints
  async getMaintenanceRequests(params?: {
    skip?: number
    limit?: number
    student_id?: number
    status_id?: number
    category_id?: number
  }): Promise<MaintenanceRequest[]> {
    const searchParams = new URLSearchParams()
    if (params?.skip) searchParams.append("skip", params.skip.toString())
    if (params?.limit) searchParams.append("limit", params.limit.toString())
    if (params?.student_id) searchParams.append("student_id", params.student_id.toString())
    if (params?.status_id) searchParams.append("status_id", params.status_id.toString())
    if (params?.category_id) searchParams.append("category_id", params.category_id.toString())

    const query = searchParams.toString()
    return this.request<MaintenanceRequest[]>(`/maintenance-requests${query ? `?${query}` : ""}`)
  }

  async getMaintenanceRequest(requestId: number): Promise<MaintenanceRequest> {
    return this.request<MaintenanceRequest>(`/maintenance-requests/${requestId}`)
  }

  async createMaintenanceRequest(
    requestData: Omit<MaintenanceRequest, "issue_ID" | "submission_timestamp" | "last_updated">,
  ): Promise<MaintenanceRequest> {
    return this.request<MaintenanceRequest>("/maintenance-requests", {
      method: "POST",
      body: JSON.stringify(requestData),
    })
  }

  async updateMaintenanceRequest(
    requestId: number,
    requestData: Partial<MaintenanceRequest>,
  ): Promise<MaintenanceRequest> {
    return this.request<MaintenanceRequest>(`/maintenance-requests/${requestId}`, {
      method: "PUT",
      body: JSON.stringify(requestData),
    })
  }

  async deleteMaintenanceRequest(requestId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/maintenance-requests/${requestId}`, {
      method: "DELETE",
    })
  }

  async getActiveRequests(): Promise<MaintenanceRequest[]> {
    return this.request<MaintenanceRequest[]>("/maintenance-requests/active")
  }

  async getRequestsByHall(hallId: number): Promise<MaintenanceRequest[]> {
    return this.request<MaintenanceRequest[]>(`/maintenance-requests/hall/${hallId}`)
  }
}

export const apiClient = new ApiClient(API_BASE_URL)

// Helper functions for common operations
export const userHelpers = {
  getStudents: () => apiClient.getUsers({ role: "student" }),
  getOfficers: () => apiClient.getUsers({ role: "officer" }),
  getManagers: () => apiClient.getUsers({ role: "manager" }),
  getAdmins: () => apiClient.getUsers({ role: "admin" }),
}

export const maintenanceHelpers = {
  getPendingRequests: () => apiClient.getMaintenanceRequests({ status_id: 1 }),
  getCompletedRequests: () => apiClient.getMaintenanceRequests({ status_id: 4 }),
  getRequestsByStudent: (studentId: number) => apiClient.getMaintenanceRequests({ student_id: studentId }),
}
