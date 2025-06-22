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
  private static API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "https://hostel-management-system-production-5590.up.railway.app/api/v1"

  static async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Invalid email or password")
        } else if (response.status === 422) {
          throw new Error("Please check your email and password format")
        } else {
          // Try to get error details from response
          try {
            const errorData = await response.json()
            throw new Error(errorData.detail || "Login failed. Please try again.")
          } catch {
            throw new Error("Login failed. Please try again.")
          }
        }
      }

      const data: LoginResponse = await response.json()

      // Store token and user data
      this.setToken(data.access_token)
      this.setUser(data.user)

      return data
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error("Network error. Please check your connection.")
    }
  }

  static async forgotPassword(email: string): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/auth/forgot-password`, {
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
      const response = await fetch(`${this.API_BASE_URL}/auth/verify`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          this.logout() // Clear invalid token
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
