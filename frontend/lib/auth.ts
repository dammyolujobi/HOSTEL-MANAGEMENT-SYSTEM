export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: {
    id: number
    name: string
    email: string
    role: string
    phone_number?: string
  }
  expires_in: number
}

export class AuthService {
  private static TOKEN_KEY = "hostel_ms_token"
  private static USER_KEY = "hostel_ms_user"
  
  // Environment-aware API URL configuration
  private static getApiBaseUrl() {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL
    }
    
    // Default to production if no environment variable is set
    return "https://hostel-management-system-production-cc97.up.railway.app"
  }
  
  private static API_BASE_URL = AuthService.getApiBaseUrl()

  static async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      console.log("🔐 Attempting login with:", credentials.email)
      console.log("🌐 API URL:", `${this.API_BASE_URL}/api/v1/auth/login`)

      const response = await fetch(`${this.API_BASE_URL}/api/v1/auth/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(credentials),
      })

      console.log("📡 Response status:", response.status)

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Invalid email or password")
        } else if (response.status === 422) {
          const errorData = await response.json()
          console.error("❌ Validation error:", errorData)
          throw new Error("Please check your email and password format")
        } else if (response.status === 0) {
          throw new Error("Cannot connect to server. CORS error detected.")
        } else {
          try {
            const errorData = await response.json()
            console.error("❌ Server error:", errorData)
            throw new Error(errorData.detail || `Server error: ${response.status}`)
          } catch {
            throw new Error(`Server error: ${response.status}. Please try again.`)
          }
        }
      }

      const data: LoginResponse = await response.json()
      console.log("✅ Login successful:", data.user)

      // Store token and user data
      this.setToken(data.access_token)
      this.setUser(data.user)

      return data
    } catch (error) {
      console.error("🚨 Login error:", error)
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error("CORS error: Cannot connect to backend. Please check server configuration.")
      }
      if (error instanceof Error) {
        throw error
      }
      throw new Error("Network error. Please check your connection and try again.")
    }
  }

  static async testConnection(): Promise<{ connected: boolean; message: string }> {
    try {
      console.log("🧪 Testing API connection...")
      const healthUrl = `${this.API_BASE_URL}/health`

      const response = await fetch(healthUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      })

      console.log("🏥 Health check status:", response.status)

      if (response.ok) {
        const data = await response.json()
        return { connected: true, message: "Connected successfully" }
      } else {
        return { connected: false, message: `Server responded with status ${response.status}` }
      }
    } catch (error) {
      console.error("🚨 Connection test failed:", error)
      if (error instanceof TypeError && error.message.includes("fetch")) {
        return { connected: false, message: "CORS error: Cannot reach server" }
      }
      return { connected: false, message: "Connection failed" }
    }
  }

  static async forgotPassword(email: string): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/v1/auth/forgot-password/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        throw new Error("Failed to send reset email")
      }
    } catch (error) {
      throw new Error("Failed to send reset email")
    }
  }

  static async getCurrentUser(): Promise<any> {
    const token = this.getToken()
    if (!token) {
      throw new Error("No authentication token found")
    }

    try {
      const response = await fetch(`${this.API_BASE_URL}/api/v1/auth/verify`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          this.logout()
          throw new Error("Session expired. Please login again.")
        }
        throw new Error("Failed to get user information")
      }

      const result = await response.json()
      return result
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error("Network error. Please check your connection.")
    }
  }

  static setToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(this.TOKEN_KEY, token)
    }
  }

  static getToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(this.TOKEN_KEY)
    }
    return null
  }

  static setUser(user: any): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user))
    }
  }

  static getUser(): any | null {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem(this.USER_KEY)
      return user ? JSON.parse(user) : null
    }
    return null
  }

  static logout(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.TOKEN_KEY)
      localStorage.removeItem(this.USER_KEY)
    }
  }

  static isAuthenticated(): boolean {
    return this.getToken() !== null
  }

  static getAuthHeaders(): Record<string, string> {
    const token = this.getToken()
    return token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}
  }
}
