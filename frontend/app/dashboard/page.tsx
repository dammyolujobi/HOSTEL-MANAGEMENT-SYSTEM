"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
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
  WifiOff,
  RefreshCw,
  Eye,
  CheckCircle,
  Clock,
  X,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { AuthService } from "@/lib/auth"
import { apiClient } from "@/lib/api"

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

interface StatusUpdateData {
  requestId: number
  currentStatus: string
  title: string
  description: string
  onUpdate: (statusId: number, statusName: string) => void
}

interface RequestDetailsData {
  request: any
  onClose: () => void
}


export default function DashboardPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [userRole, setUserRole] = useState<string>("student")
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [retryCount, setRetryCount] = useState(0)
  
  // Modal states to replace browser popups
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [showRequestDetails, setShowRequestDetails] = useState(false)
  const [showStatusUpdate, setShowStatusUpdate] = useState(false)
  const [statusUpdateData, setStatusUpdateData] = useState<StatusUpdateData | null>(null)
  const [successMessage, setSuccessMessage] = useState("")

  useEffect(() => {
    const role = searchParams.get("role") || "student"
    setUserRole(role)
    loadDashboardData(role)
  }, [searchParams])

  const loadDashboardData = async (role: string, isRetry = false) => {
    try {
      setLoading(true)
      if (!isRetry) {
        setError("")
      }

      const currentUser = AuthService.getUser()

      if (!currentUser) {
        router.push("/login")
        return
      }

      // Initialize with default data in case API calls fail
      let maintenanceRequests: any[] = []
      const stats = { totalRequests: 0, activeRequests: 0, completedRequests: 0, pendingRequests: 0 }

      try {
        // Try to fetch data from API
        if (role === "student") {
          // For demo purposes, we'll use mock data if API fails
          try {
            maintenanceRequests = await apiClient.getMaintenanceRequests({ student_id: currentUser.id })
          } catch (apiError) {
            console.warn("API call failed, using mock data:", apiError)
            // Use mock data for demo
            maintenanceRequests = [
              {
                issue_ID: 1,
                description: "Leaky faucet in bathroom",
                category: { category_name: "Plumbing" },
                status: { status_name: "Pending" },
                submission_timestamp: new Date().toISOString(),
              },
              {
                issue_ID: 2,
                description: "Broken desk lamp",
                category: { category_name: "Electrical" },
                status: { status_name: "In Progress" },
                submission_timestamp: new Date(Date.now() - 86400000).toISOString(),
              },
            ]
          }
        } else if (role === "hall_officer") {
          // For hall officers, filter by their hall
          try {
            const hallResponse = await apiClient.getHallOfficerHallId(currentUser.id)
            const hallId = hallResponse.hall_id
            if (hallId) {
              maintenanceRequests = await apiClient.getMaintenanceRequests({ hall_id: hallId })
            } else {
              maintenanceRequests = []
            }
          } catch (apiError) {
            console.warn("API call failed for hall officer, using mock data:", apiError)
            maintenanceRequests = [
              {
                issue_ID: 1,
                description: "Leaky faucet in Room 101",
                category: { category_name: "Plumbing" },
                status: { status_name: "Pending" },
                submission_timestamp: new Date().toISOString(),
                room: { room_number: "101", hall: { hall_name: "John Hall" } }
              },
              {
                issue_ID: 2,
                description: "AC not working in Room 205",
                category: { category_name: "HVAC" },
                status: { status_name: "In Progress" },
                submission_timestamp: new Date(Date.now() - 86400000).toISOString(),
                room: { room_number: "205", hall: { hall_name: "John Hall" } }
              },
            ]
          }
        } else {
          // For other roles, try API or use mock data
          try {
            maintenanceRequests = await apiClient.getMaintenanceRequests()
          } catch (apiError) {
            console.warn("API call failed, using mock data:", apiError)
            maintenanceRequests = [
              {
                issue_ID: 1,
                description: "Leaky faucet in Room 101",
                category: { category_name: "Plumbing" },
                status: { status_name: "Pending" },
                submission_timestamp: new Date().toISOString(),
              },
              {
                issue_ID: 2,
                description: "AC not working in Room 205",
                category: { category_name: "HVAC" },
                status: { status_name: "In Progress" },
                submission_timestamp: new Date(Date.now() - 86400000).toISOString(),
              },
              {
                issue_ID: 3,
                description: "Broken window in Room 150",
                category: { category_name: "Maintenance" },
                status: { status_name: "Completed" },
                submission_timestamp: new Date(Date.now() - 172800000).toISOString(),
              },
            ]
          }
        }

        // Calculate stats from the data we have
        stats.totalRequests = maintenanceRequests.length
        stats.activeRequests = maintenanceRequests.filter((r) => r.status?.status_name !== "Completed").length
        stats.completedRequests = maintenanceRequests.filter((r) => r.status?.status_name === "Completed").length
        stats.pendingRequests = maintenanceRequests.filter((r) => r.status?.status_name === "Pending").length

        setDashboardData({
          user: currentUser,
          maintenanceRequests,
          stats,
        })

        setError("") // Clear any previous errors
      } catch (dataError: any) {
        console.error("Failed to load dashboard data:", dataError)

        // Set mock data even if everything fails
        setDashboardData({
          user: currentUser,
          maintenanceRequests: [],
          stats: { totalRequests: 0, activeRequests: 0, completedRequests: 0, pendingRequests: 0 },
        })

        if (dataError.message?.includes("CORS") || dataError.message?.includes("fetch")) {
          setError("Cannot connect to backend server. Using demo mode.")
        } else {
          setError("Failed to load data. Using demo mode.")
        }
      }
    } catch (err: any) {
      console.error("Dashboard error:", err)
      setError(err.message || "Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
    loadDashboardData(userRole, true)
  }

  const handleLogout = () => {
    AuthService.logout()
    router.push("/login")
  }

  const handleViewRequestDetails = (requestId: number) => {
    const request = dashboardData?.maintenanceRequests.find(r => r.issue_ID === requestId)
    if (request) {
      setSelectedRequest(request)
      setShowRequestDetails(true)
    }
  }

  const handleMarkComplete = async (requestId: number) => {
    try {
      setLoading(true)
      await apiClient.markRequestComplete(requestId)
      await loadDashboardData(userRole)
      setSuccessMessage(`Request #${requestId} has been marked as complete!`)
      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (error: any) {
      console.error("Failed to update request:", error)
      setError(`Failed to update request: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (requestId: number, statusName: string) => {
    try {
      setLoading(true)
      switch (statusName) {
        case "In Progress":
          await apiClient.markRequestInProgress(requestId)
          break
        case "Under Review":
          await apiClient.markRequestUnderReview(requestId)
          break
        case "Completed":
          await apiClient.markRequestComplete(requestId)
          break
        case "Pending":
          await apiClient.reopenRequest(requestId)
          break
        default:
          throw new Error(`Unknown status: ${statusName}`)
      }
      await loadDashboardData(userRole)
      setSuccessMessage(`Request #${requestId} has been updated to "${statusName}"!`)
      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (error: any) {
      console.error("Failed to update request:", error)
      setError(`Failed to update request: ${error.message}`)
    } finally {
      setLoading(false)
    }
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

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <WifiOff className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-2">
            <Button onClick={handleRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const renderStudentDashboard = () => (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={handleRetry}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

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
            <CardTitle>
              {userRole === "student" ? "My Maintenance Requests" : 
               userRole === "hall officer" ? "Hall Maintenance Requests" :
               "All Maintenance Requests"}
            </CardTitle>
            {/* Only students can create maintenance requests */}
            {userRole === "student" && (
              <Button asChild>
                <Link href="/maintenance/new">
                  <Plus className="h-4 w-4 mr-2" />
                  New Request
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData.maintenanceRequests.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-muted-foreground">No maintenance requests found.</p>
                {/* Only students can create maintenance requests */}
                {userRole === "student" && (
                  <Button asChild className="mt-4">
                    <Link href="/maintenance/new">Create Your First Request</Link>
                  </Button>
                )}
              </div>
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
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={handleRetry}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

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
                  <Button 
                    size="sm" 
                    onClick={() => handleViewRequestDetails(request.issue_ID)}
                  >
                    View Details
                  </Button>
                  {request.status?.status_name !== "Completed" && (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleUpdateStatus(request.issue_ID, "In Progress")}
                      >
                        In Progress
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleMarkComplete(request.issue_ID)}
                      >
                        Complete
                      </Button>
                    </>
                  )}
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
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={handleRetry}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

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
          <CardTitle>Hall Maintenance Requests</CardTitle>
          <CardDescription>Requests from your assigned hall</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData.maintenanceRequests.slice(0, 5).map((request) => (
              <div key={request.issue_ID} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium">Request #{request.issue_ID}</p>
                  <p className="text-sm text-muted-foreground">
                    {request.category?.category_name} • 
                    {request.room?.room_number && ` Room ${request.room.room_number}`}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">{request.status?.status_name}</Badge>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleViewRequestDetails(request.issue_ID)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  {request.status?.status_name !== "Completed" && (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleUpdateStatus(request.issue_ID, "In Progress")}
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        In Progress
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleMarkComplete(request.issue_ID)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Complete
                      </Button>
                    </>
                  )}
                </div>
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
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={handleRetry}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

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
                <CardDescription>Latest maintenance requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.maintenanceRequests.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No maintenance requests found</p>
                  ) : (
                    dashboardData.maintenanceRequests.slice(0, 5).map((request) => (
                      <div key={request.issue_ID} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">Request #{request.issue_ID}</span>
                            <Badge variant="outline" className="text-xs">
                              {request.category?.category_name || 'Unknown'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {request.description ? request.description.substring(0, 80) + '...' : 'No description'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Room {request.room?.room_number || 'N/A'} • 
                            {request.submission_timestamp ? new Date(request.submission_timestamp).toLocaleDateString() : 'Unknown date'}
                          </p>
                        </div>
                        <Badge 
                          variant={
                            request.status?.status_name === 'Completed' ? 'default' :
                            request.status?.status_name === 'Pending' ? 'destructive' :
                            'secondary'
                          }
                        >
                          {request.status?.status_name || 'Unknown'}
                        </Badge>
                      </div>
                    ))
                  )}
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
                {dashboardData.maintenanceRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <ClipboardList className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-muted-foreground">No maintenance requests found.</p>
                  </div>
                ) : (
                  dashboardData.maintenanceRequests.map((request) => (
                    <div key={request.issue_ID} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-medium">Request #{request.issue_ID}</h4>
                          <Badge variant="outline">{request.category?.category_name || 'Unknown'}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {request.description || 'No description provided'}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                          <span>🏠 Room {request.room?.room_number || 'N/A'}</span>
                          <span>📅 {request.submission_timestamp ? new Date(request.submission_timestamp).toLocaleDateString() : 'Unknown date'}</span>
                          <span>⏰ {request.submission_timestamp ? new Date(request.submission_timestamp).toLocaleTimeString() : 'Unknown time'}</span>
                        </div>
                        {request.availability && (
                          <p className="text-xs text-muted-foreground mt-1">
                            📋 Availability: {request.availability}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={
                            request.status?.status_name === 'Completed' ? 'default' :
                            request.status?.status_name === 'Pending' ? 'destructive' :
                            request.status?.status_name === 'In Progress' ? 'secondary' :
                            'outline'
                          }
                        >
                          {request.status?.status_name || 'Unknown'}
                        </Badge>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request)
                            setShowRequestDetails(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Reports & Analytics</CardTitle>
              <CardDescription>System statistics and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                    <CardTitle className="text-sm font-medium">Pending</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.stats.pendingRequests}</div>
                    <p className="text-xs text-muted-foreground">Awaiting action</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.stats.activeRequests}</div>
                    <p className="text-xs text-muted-foreground">Being worked on</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completed</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
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
                    <CardTitle>Requests by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(() => {
                        // Group requests by category
                        const categoryStats = dashboardData.maintenanceRequests.reduce<Record<string, number>>((acc, request) => {
                          const category = request.category?.category_name || 'Unknown';
                          acc[category] = (acc[category] || 0) + 1;
                          return acc;
                        }, {});

                        return Object.entries(categoryStats).map(([category, count]) => (
                          <div key={category} className="flex justify-between items-center">
                            <span className="text-sm">{category}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ 
                                    width: `${((count as number) / dashboardData.stats.totalRequests) * 100}%` 
                                  }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium w-8 text-right">{count}</span>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Requests Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dashboardData.maintenanceRequests.slice(0, 8).map((request) => (
                        <div key={request.issue_ID} className="flex items-start space-x-3 text-sm">
                          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">#{request.issue_ID} - {request.category?.category_name}</p>
                                <p className="text-muted-foreground">Room {request.room?.room_number}</p>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {request.status?.status_name}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
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

      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50">
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Request Details Modal */}
      {showRequestDetails && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Request Details</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowRequestDetails(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Request ID</Label>
                  <p className="text-sm text-muted-foreground">#{selectedRequest.issue_ID}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Category</Label>
                  <p className="text-sm text-muted-foreground">{selectedRequest.category?.category_name}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm text-muted-foreground">{selectedRequest.description}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant="secondary">{selectedRequest.status?.status_name}</Badge>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Submitted</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedRequest.submission_timestamp).toLocaleDateString()}
                  </p>
                </div>

                {selectedRequest.room && (
                  <div>
                    <Label className="text-sm font-medium">Room</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedRequest.room.room_number} 
                      {selectedRequest.room.hall?.hall_name && ` - ${selectedRequest.room.hall.hall_name}`}
                    </p>
                  </div>
                )}

                {selectedRequest.availability && (
                  <div>
                    <Label className="text-sm font-medium">Availability</Label>
                    <p className="text-sm text-muted-foreground">{selectedRequest.availability}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={() => setShowRequestDetails(false)}>
                  Close
                </Button>
                {userRole === "hall_officer" && selectedRequest.status?.status_name !== "Completed" && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleUpdateStatus(selectedRequest.issue_ID, "In Progress")
                        setShowRequestDetails(false)
                      }}
                    >
                      Mark In Progress
                    </Button>
                    <Button
                      onClick={() => {
                        handleMarkComplete(selectedRequest.issue_ID)
                        setShowRequestDetails(false)
                      }}
                    >
                      Mark Complete
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

