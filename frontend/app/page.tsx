"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, Users, Wrench, BarChart3, LogIn } from "lucide-react"
import { useRouter } from "next/navigation"
import { AuthService } from "@/lib/auth"

export default function HomePage() {
  const router = useRouter()
  const [loginForm, setLoginForm] = useState({ email: "", password: "" })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

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
      // Try to login with demo credentials
      const demoCredentials = {
        email: `${role}@demo.com`,
        password: "demo123",
      }

      const response = await AuthService.login(demoCredentials)
      const userRole = response.user.role.toLowerCase()
      router.push(`/dashboard?role=${userRole}`)
    } catch (err: any) {
      setError("Demo account not available. Please use the login form.")
    } finally {
      setIsLoading(false)
    }
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
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="demo">Demo</TabsTrigger>
                  </TabsList>

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
                          disabled={isLoading}
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
                          disabled={isLoading}
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Signing in..." : "Sign In"}
                      </Button>
                    </form>
                  </TabsContent>

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
                        className="w-full justify-start"
                        onClick={() => handleDemoAccess("student")}
                        disabled={isLoading}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Student Dashboard
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => handleDemoAccess("officer")}
                        disabled={isLoading}
                      >
                        <Wrench className="h-4 w-4 mr-2" />
                        Maintenance Officer
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => handleDemoAccess("hall_officer")}
                        disabled={isLoading}
                      >
                        <Building2 className="h-4 w-4 mr-2" />
                        Hall Officer
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => handleDemoAccess("admin")}
                        disabled={isLoading}
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Administrator
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
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
            <p>&copy; 2024 HostelMS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
