// Environment-aware API configuration
const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }
  
  // Default to local development for local work
  return "http://localhost:8000"
}

const API_BASE_URL = getApiBaseUrl()

// Log the current API URL for debugging
console.log("🔗 API Base URL:", API_BASE_URL)

import { AuthService } from "./auth"

export interface User {
  id: number
  name: string
  email: string
  phone_number?: string
  role: "student" | "officer" | "hall_officer" | "admin"
  created_at: string
  updated_at: string
  student_ID?: number  // Only present for students
  room_ID?: number     // Only present for students
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
  student?: any
  room?: any
  category?: any
  status?: any
}

class ApiClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL.replace(/\/$/, "")
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Always ensure we have the full /api/v1 prefix
    const fullEndpoint = endpoint.startsWith("/api/v1") ? endpoint : `/api/v1${endpoint}`
    const url = `${this.baseURL}${fullEndpoint}`

    console.log("🌐 Making API request to:", url) // Debug log

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...AuthService.getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        if (response.status === 401) {
          AuthService.logout()
          window.location.href = "/login"
          throw new Error("Session expired. Please login again.")
        }

        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.detail || errorData.message || errorMessage
        } catch {
          // If we can't parse the error response, use the default message
        }

        throw new Error(errorMessage)
      }

      return await response.json()
    } catch (error) {
      console.error("API request failed:", error)
      throw error
    }
  }

  // User endpoints - All with /api/v1 prefix
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

  // Maintenance Request endpoints - All with /api/v1 prefix
  async getMaintenanceRequests(params?: {
    skip?: number
    limit?: number
    student_id?: number
    status_id?: number
    category_id?: number
    hall_id?: number
  }): Promise<MaintenanceRequest[]> {
    const searchParams = new URLSearchParams()
    if (params?.skip) searchParams.append("skip", params.skip.toString())
    if (params?.limit) searchParams.append("limit", params.limit.toString())
    if (params?.student_id) searchParams.append("student_id", params.student_id.toString())
    if (params?.status_id) searchParams.append("status_id", params.status_id.toString())
    if (params?.category_id) searchParams.append("category_id", params.category_id.toString())
    if (params?.hall_id) searchParams.append("hall_id", params.hall_id.toString())

    const query = searchParams.toString()
    return this.request<MaintenanceRequest[]>(`/maintenance-requests/${query ? `?${query}` : ""}`)
  }

  async getMaintenanceRequest(requestId: number): Promise<MaintenanceRequest> {
    return this.request<MaintenanceRequest>(`/maintenance-requests/${requestId}`)
  }

  async createMaintenanceRequest(
    requestData: Omit<MaintenanceRequest, "issue_ID" | "submission_timestamp" | "last_updated">,
  ): Promise<MaintenanceRequest> {
    console.log("Creating maintenance request with data:", requestData)
    return this.request<MaintenanceRequest>("/maintenance-requests/", {
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
    return this.request<MaintenanceRequest[]>(`/maintenance-requests?hall_id=${hallId}`)
  }

  // Get Hall Officer's Hall ID
  async getHallOfficerHallId(userId: number): Promise<{ hall_id: number | null }> {
    return this.request<{ hall_id: number | null }>(`/users/${userId}/hall`)
  }

  // Status Update Methods
  async updateRequestStatus(requestId: number, statusId: number): Promise<MaintenanceRequest> {
    return this.request<MaintenanceRequest>(`/maintenance-requests/${requestId}/status/${statusId}`, {
      method: "PATCH",
    })
  }

  async markRequestInProgress(requestId: number): Promise<MaintenanceRequest> {
    return this.request<MaintenanceRequest>(`/maintenance-requests/${requestId}/in-progress`, {
      method: "PATCH",
    })
  }

  async markRequestComplete(requestId: number): Promise<MaintenanceRequest> {
    return this.request<MaintenanceRequest>(`/maintenance-requests/${requestId}/complete`, {
      method: "PATCH",
    })
  }

  async markRequestUnderReview(requestId: number): Promise<MaintenanceRequest> {
    return this.request<MaintenanceRequest>(`/maintenance-requests/${requestId}/under-review`, {
      method: "PATCH",
    })
  }

  async reopenRequest(requestId: number): Promise<MaintenanceRequest> {
    return this.request<MaintenanceRequest>(`/maintenance-requests/${requestId}/reopen`, {
      method: "PATCH",
    })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)

// Helper functions for common operations
export const userHelpers = {
  getStudents: () => apiClient.getUsers({ role: "student" }),
  getOfficers: () => apiClient.getUsers({ role: "officer" }),
  getHallOfficers: () => apiClient.getUsers({ role: "hall_officer" }),
  getAdmins: () => apiClient.getUsers({ role: "admin" }),
}

export const maintenanceHelpers = {
  getPendingRequests: () => apiClient.getMaintenanceRequests({ status_id: 1 }),
  getCompletedRequests: () => apiClient.getMaintenanceRequests({ status_id: 4 }),
  getRequestsByStudent: (studentId: number) => apiClient.getMaintenanceRequests({ student_id: studentId }),
}
