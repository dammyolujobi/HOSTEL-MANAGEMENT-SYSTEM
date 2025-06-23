"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, Users, Wrench, BarChart3, LogIn, Wifi, WifiOff, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"
import { AuthService } from "@/lib/auth"

export default function HomePage() {
  const router = useRouter()
  const [loginForm, setLoginForm] = useState({ email: "", password: "" })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [connectionStatus, setConnectionStatus] = useState<{
    status: "checking" | "connected" | "disconnected"
    message: string
  }>({ status: "checking", message: "Checking connection..." })

  useEffect(() => {
    // Test API connection on page load
    const testConnection = async () => {
      const result = await AuthService.testConnection()
      setConnectionStatus({
        status: result.connected ? "connected" : "disconnected",
        message: result.message,
      })
    }
    testConnection()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await AuthService.login(loginForm)
      const userRole = response.user.role.toLowerCase()
      router.push(`/dashboard?role=${userRole}`)
    } catch (err: any) {
      setError(err.message || "Invalid email or password. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoAccess = async (role: string) => {
    setIsLoading(true)
    setError("")

    try {
      // Use the correct demo credentials from your backend
      const demoCredentials = {
        student: { email: "jane.student@university.edu", password: "student123" },
        officer: { email: "bob.maintenance@university.edu", password: "maintenance123" },
        hall_officer: { email: "hall.officer@university.edu", password: "officer123" },
        admin: { email: "admin@university.edu", password: "admin123" },
      }

      const credentials = demoCredentials[role as keyof typeof demoCredentials]
      if (!credentials) {
        throw new Error("Invalid role")
      }

      console.log(`🎭 Trying ${role} demo with:`, credentials.email)
      const response = await AuthService.login(credentials)
      const userRole = response.user.role.toLowerCase()
      router.push(`/dashboard?role=${userRole}`)
    } catch (err: any) {
      console.error(`❌ ${role} demo failed:`, err)
      setError(err.message || "Demo account not available. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const retryConnection = async () => {
    setConnectionStatus({ status: "checking", message: "Retrying connection..." })
    const result = await AuthService.testConnection()
    setConnectionStatus({
      status: result.connected ? "connected" : "disconnected",
      message: result.message,
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">HostelMS</h1>
            </div>

            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              {connectionStatus.status === "checking" && (
                <div className="flex items-center space-x-1 text-yellow-600">
                  <Wifi className="h-4 w-4 animate-pulse" />
                  <span className="text-sm">Checking...</span>
                </div>
              )}
              {connectionStatus.status === "connected" && (
                <div className="flex items-center space-x-1 text-green-600">
                  <Wifi className="h-4 w-4" />
                  <span className="text-sm">Connected</span>
                </div>
              )}
              {connectionStatus.status === "disconnected" && (
                <div className="flex items-center space-x-1 text-red-600 cursor-pointer" onClick={retryConnection}>
                  <WifiOff className="h-4 w-4" />
                  <span className="text-sm">Retry</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Complete Hostel Management Solution</h2>
              <p className="text-xl text-gray-600 mb-8">
                Streamline your hostel operations with our comprehensive management system. Handle maintenance requests,
                manage rooms, and oversee student accommodations all in one place.
              </p>
            </div>

            {/* Login Card */}
            <Card className="w-full max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <LogIn className="h-5 w-5" />
                  <span>Login to HostelMS</span>
                </CardTitle>
                <CardDescription>Access your hostel management dashboard</CardDescription>
              </CardHeader>
              <CardContent>
                {connectionStatus.status === "disconnected" && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p>
                          <strong>CORS Error:</strong> {connectionStatus.message}
                        </p>
                        <p className="text-sm">
                          The backend needs to allow requests from this domain. Please update your backend CORS settings
                          to include:
                        </p>
                        <code className="text-xs bg-gray-100 p-1 rounded">
                          https://v0-frontend-build-with-next-js.vercel.app
                        </code>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <Tabs defaultValue="demo" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="demo">Demo Access</TabsTrigger>
                    <TabsTrigger value="login">Login</TabsTrigger>
                  </TabsList>

                  <TabsContent value="demo" className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <p className="text-sm text-gray-600">Try our system with demo credentials:</p>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full justify-between text-left"
                        onClick={() => handleDemoAccess("student")}
                        disabled={isLoading || connectionStatus.status === "disconnected"}
                      >
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          Student Dashboard
                        </div>
                        <span className="text-xs text-gray-500">jane.student@university.edu</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-between text-left"
                        onClick={() => handleDemoAccess("officer")}
                        disabled={isLoading || connectionStatus.status === "disconnected"}
                      >
                        <div className="flex items-center">
                          <Wrench className="h-4 w-4 mr-2" />
                          Maintenance Officer
                        </div>
                        <span className="text-xs text-gray-500">bob.maintenance@university.edu</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-between text-left"
                        onClick={() => handleDemoAccess("hall_officer")}
                        disabled={isLoading || connectionStatus.status === "disconnected"}
                      >
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 mr-2" />
                          Hall Officer
                        </div>
                        <span className="text-xs text-gray-500">hall.officer@university.edu</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-between text-left"
                        onClick={() => handleDemoAccess("admin")}
                        disabled={isLoading || connectionStatus.status === "disconnected"}
                      >
                        <div className="flex items-center">
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Administrator
                        </div>
                        <span className="text-xs text-gray-500">admin@university.edu</span>
                      </Button>
                    </div>
                    {isLoading && <p className="text-sm text-center text-gray-500">Connecting to backend...</p>}
                  </TabsContent>

                  <TabsContent value="login" className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          value={loginForm.email}
                          onChange={(e) => {
                            setLoginForm({ ...loginForm, email: e.target.value })
                            if (error) setError("")
                          }}
                          required
                          disabled={isLoading || connectionStatus.status === "disconnected"}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Enter your password"
                          value={loginForm.password}
                          onChange={(e) => {
                            setLoginForm({ ...loginForm, password: e.target.value })
                            if (error) setError("")
                          }}
                          required
                          disabled={isLoading || connectionStatus.status === "disconnected"}
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading || connectionStatus.status === "disconnected"}
                      >
                        {isLoading ? "Signing in..." : "Sign In"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

                {/* Debug Info */}
                <div className="mt-4 p-3 bg-gray-50 rounded text-xs">
                  <p>
                    <strong>Backend URL:</strong> http://localhost:8000
                  </p>
                  <p>
                    <strong>Status:</strong> {connectionStatus.message}
                  </p>
                  <p>
                    <strong>Frontend URL:</strong> http://localhost:3000 (Local Development)
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Everything You Need to Manage Your Hostel</h3>
            <p className="text-xl text-gray-600">Comprehensive tools for efficient hostel management</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Manage students, officers, hall officers, and administrators with role-based access control.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Wrench className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle>Maintenance Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Track and manage maintenance requests from submission to completion.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Building2 className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle>Room Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Organize halls, rooms, and student accommodations efficiently.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-8 w-8 text-orange-600 mb-2" />
                <CardTitle>Analytics & Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Get insights with comprehensive reporting and analytics tools.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Building2 className="h-6 w-6" />
              <span className="text-lg font-bold">HostelMS</span>
            </div>
            <p className="text-gray-400">Complete hostel management solution for educational institutions.</p>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 HostelMS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
