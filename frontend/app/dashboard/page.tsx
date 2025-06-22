"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Building2,
  Users,
  Wrench,
  BarChart3,
  Plus,
  Search,
  Filter,
  Bell,
  Settings,
  LogOut,
  ClipboardList,
  UserCheck,
  AlertTriangle,
  Loader2,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { AuthService } from "@/lib/auth"
import { apiClient, maintenanceHelpers } from "@/lib/api"

interface DashboardData {
  user: any
  maintenanceRequests: any[]
  stats: {
    totalRequests: number
    activeRequests: number
    completedRequests: number
    pendingRequests: number
  }
}

export default function DashboardPage() {
  const searchParams = useSearchParams()
  const [userRole, setUserRole] = useState<string>("student")
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const role = searchParams.get("role") || "student"
    setUserRole(role)
    loadDashboardData(role)
  }, [searchParams])

  const loadDashboardData = async (role: string) => {
    try {
      setLoading(true)
      const currentUser = AuthService.getUser()

      if (!currentUser) {
        window.location.href = "/login"
        return
      }

      // Fetch user-specific data based on role
      let maintenanceRequests = []
      const stats = { totalRequests: 0, activeRequests: 0, completedRequests: 0, pendingRequests: 0 }

      if (role === "student") {
        // Get student's maintenance requests
        maintenanceRequests = await apiClient.getMaintenanceRequests({ student_id: currentUser.id })
        stats.totalRequests = maintenanceRequests.length
        stats.activeRequests = maintenanceRequests.filter((r) => r.status_ID !== 4).length
        stats.completedRequests = maintenanceRequests.filter((r) => r.status_ID === 4).length
        stats.pendingRequests = maintenanceRequests.filter((r) => r.status_ID === 1).length
      } else if (role === "officer") {
        // Get officer's assigned requests
        maintenanceRequests = await apiClient.getMaintenanceRequests()
        stats.totalRequests = maintenanceRequests.length
        stats.activeRequests = await apiClient.getActiveRequests().then((r) => r.length)
        stats.completedRequests = await maintenanceHelpers.getCompletedRequests().then((r) => r.length)
        stats.pendingRequests = await maintenanceHelpers.getPendingRequests().then((r) => r.length)
      } else if (role === "hall_officer") {
        // Get all requests for hall officer's hall
        maintenanceRequests = await apiClient.getMaintenanceRequests()
        stats.totalRequests = maintenanceRequests.length
        stats.activeRequests = await apiClient.getActiveRequests().then((r) => r.length)
        stats.completedRequests = await maintenanceHelpers.getCompletedRequests().then((r) => r.length)
        stats.pendingRequests = await maintenanceHelpers.getPendingRequests().then((r) => r.length)
      } else if (role === "admin") {
        // Get system-wide statistics
        maintenanceRequests = await apiClient.getMaintenanceRequests()
        const allUsers = await apiClient.getUsers()
        stats.totalRequests = maintenanceRequests.length
        stats.activeRequests = await apiClient.getActiveRequests().then((r) => r.length)
        stats.completedRequests = await maintenanceHelpers.getCompletedRequests().then((r) => r.length)
        stats.pendingRequests = await maintenanceHelpers.getPendingRequests().then((r) => r.length)
      }

      setDashboardData({
        user: currentUser,
        maintenanceRequests,
        stats,
      })
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    AuthService.logout()
    window.location.href = "/login"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => loadDashboardData(userRole)}>Retry</Button>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return null
  }

  const renderStudentDashboard = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.stats.totalRequests}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Requests</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.stats.activeRequests}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.stats.completedRequests}</div>
            <p className="text-xs text-muted-foreground">Resolved</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>My Maintenance Requests</CardTitle>
            <Button asChild>
              <Link href="/maintenance/new">
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData.maintenanceRequests.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No maintenance requests found.</p>
            ) : (
              dashboardData.maintenanceRequests.slice(0, 5).map((request) => (
                <div key={request.issue_ID} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{request.description}</h4>
                    <p className="text-sm text-muted-foreground">
                      {request.category?.category_name} • {new Date(request.submission_timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={request.status?.status_name === "Completed" ? "default" : "secondary"}>
                    {request.status?.status_name || "Pending"}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderOfficerDashboard = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.stats.activeRequests}</div>
            <p className="text-xs text-muted-foreground">Pending completion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.stats.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">Awaiting assignment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.stats.completedRequests}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Maintenance Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData.maintenanceRequests.slice(0, 5).map((request) => (
              <div key={request.issue_ID} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Request #{request.issue_ID}</h4>
                  <p className="text-sm text-muted-foreground">
                    {request.category?.category_name} • {request.description.substring(0, 50)}...
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">{request.status?.status_name}</Badge>
                  <Button size="sm">View Details</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderHallOfficerDashboard = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.stats.totalRequests}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.stats.activeRequests}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.stats.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">Awaiting assignment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.stats.completedRequests}</div>
            <p className="text-xs text-muted-foreground">Resolved</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Maintenance Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.maintenanceRequests.slice(0, 5).map((request) => (
                <div key={request.issue_ID} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">Request #{request.issue_ID}</p>
                    <p className="text-sm text-muted-foreground">{request.category?.category_name}</p>
                  </div>
                  <Badge variant="secondary">{request.status?.status_name}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-20 flex-col">
                <Users className="h-6 w-6 mb-2" />
                View All Requests
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <Wrench className="h-6 w-6 mb-2" />
                Assign Officers
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <BarChart3 className="h-6 w-6 mb-2" />
                Generate Report
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <Building2 className="h-6 w-6 mb-2" />
                Manage Rooms
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderAdminDashboard = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.stats.totalRequests}</div>
            <p className="text-xs text-muted-foreground">System-wide</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.stats.activeRequests}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.stats.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">Awaiting assignment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.stats.completedRequests}</div>
            <p className="text-xs text-muted-foreground">Resolved</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.maintenanceRequests.slice(0, 5).map((request) => (
                    <div key={request.issue_ID} className="flex justify-between items-center">
                      <span>Request #{request.issue_ID}</span>
                      <Badge variant="secondary">{request.status?.status_name}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="h-20 flex-col">
                    <Users className="h-6 w-6 mb-2" />
                    Manage Users
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <Building2 className="h-6 w-6 mb-2" />
                    Manage Halls
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <Wrench className="h-6 w-6 mb-2" />
                    View Requests
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <BarChart3 className="h-6 w-6 mb-2" />
                    Generate Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage all system users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <Input placeholder="Search users..." className="max-w-sm" />
                <Button variant="outline" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-muted-foreground">User management interface would be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Overview</CardTitle>
              <CardDescription>System-wide maintenance request management</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.maintenanceRequests.map((request) => (
                  <div key={request.issue_ID} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Request #{request.issue_ID}</h4>
                      <p className="text-sm text-muted-foreground">
                        {request.category?.category_name} • {request.description.substring(0, 50)}...
                      </p>
                    </div>
                    <Badge variant="secondary">{request.status?.status_name}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Reports & Analytics</CardTitle>
              <CardDescription>Generate comprehensive reports</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Reporting interface would be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )

  const renderDashboardContent = () => {
    switch (userRole) {
      case "student":
        return renderStudentDashboard()
      case "officer":
        return renderOfficerDashboard()
      case "hall_officer":
        return renderHallOfficerDashboard()
      case "admin":
        return renderAdminDashboard()
      default:
        return renderStudentDashboard()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <Building2 className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">HostelMS</h1>
              </Link>
              <Badge variant="outline" className="capitalize">
                {userRole === "hall_officer" ? "Hall Officer" : userRole}
              </Badge>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{dashboardData.user.name}</span>
                <Button variant="ghost" size="icon" onClick={handleLogout}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {dashboardData.user.name}</h2>
          <p className="text-gray-600">
            {userRole === "student" && "Student Dashboard"}
            {userRole === "officer" && "Maintenance Officer Dashboard"}
            {userRole === "hall_officer" && "Hall Officer Dashboard"}
            {userRole === "admin" && "System Administrator Dashboard"}
          </p>
        </div>

        {renderDashboardContent()}
      </main>
    </div>
  )
}
