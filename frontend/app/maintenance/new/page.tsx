"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Building2, ArrowLeft, Send, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthService } from "@/lib/auth"
import { apiClient, User } from "@/lib/api"

interface Category {
  category_ID: number
  category_name: string
  description: string
}

export default function NewMaintenanceRequestPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    category_ID: "",
    description: "",
    availability: "",
  })
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [error, setError] = useState("")
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  useEffect(() => {
    const user = AuthService.getUser()
    if (!user) {
      router.push("/login")
      return
    }
    setCurrentUser(user)
    loadCategories()
  }, [router])

  const loadCategories = async () => {
    try {
      // Since categories aren't in your API yet, we'll use static data
      // In production, you'd fetch from: await apiClient.getCategories()
      const staticCategories = [
        { category_ID: 1, category_name: "Plumbing", description: "Water, drainage, and pipe issues" },
        { category_ID: 2, category_name: "Electrical", description: "Lighting, outlets, and electrical problems" },
        { category_ID: 3, category_name: "HVAC", description: "Heating, ventilation, and air conditioning" },
        { category_ID: 4, category_name: "Furniture", description: "Bed, desk, chair, and furniture repairs" },
        { category_ID: 5, category_name: "Cleaning", description: "Deep cleaning and sanitation requests" },
        { category_ID: 6, category_name: "Security", description: "Locks, keys, and security-related issues" },
        { category_ID: 7, category_name: "Other", description: "Other maintenance needs" },
      ]
      setCategories(staticCategories)
    } catch (err: any) {
      setError("Failed to load categories")
    } finally {
      setLoadingCategories(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (!currentUser) {
        throw new Error("User not authenticated")
      }

      // Create maintenance request
      const requestData = {
        student_ID: currentUser.student_ID || 0, // Use the actual student_ID from login
        room_ID: currentUser.room_ID || 1, // Use the actual room_ID from login
        category_ID: Number.parseInt(formData.category_ID),
        description: formData.description,
        availability: formData.availability || undefined,
        status_ID: 1, // Default to "Pending" status
      }

      console.log("🔧 Creating maintenance request:", requestData) // Debug log

      // Validate that student_ID exists
      if (!currentUser.student_ID) {
        throw new Error("Student ID not found. Please contact administrator.")
      }

      await apiClient.createMaintenanceRequest(requestData)

      // Redirect to dashboard with success message
      router.push(`/dashboard?role=${currentUser.role}&success=request_created`)
    } catch (err: any) {
      setError(err.message || "Failed to submit maintenance request. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev: typeof formData) => ({ ...prev, [field]: value }))
    if (error) setError("") // Clear error when user starts typing
  }

  if (loadingCategories) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading form...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard?role=student" className="flex items-center space-x-2">
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Dashboard</span>
              </Link>
            </div>

            <div className="flex items-center space-x-2">
              <Building2 className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">HostelMS</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">New Maintenance Request</h2>
          <p className="text-gray-600">
            Submit a maintenance request for your room. Please provide as much detail as possible.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Request Details</CardTitle>
                <CardDescription>Fill out the form below to submit your maintenance request</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category_ID}
                      onValueChange={(value) => handleInputChange("category_ID", value)}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category: Category) => (
                          <SelectItem key={category.category_ID} value={category.category_ID.toString()}>
                            <div>
                              <div className="font-medium">{category.category_name}</div>
                              <div className="text-sm text-muted-foreground">{category.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Please describe the issue in detail. Include location within your room, when you first noticed the problem, and any other relevant information."
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      rows={4}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="availability">Your Availability</Label>
                    <Textarea
                      id="availability"
                      placeholder="When are you typically available in your room for maintenance work? (e.g., weekdays after 3 PM, weekends, etc.)"
                      value={formData.availability}
                      onChange={(e) => handleInputChange("availability", e.target.value)}
                      rows={3}
                      disabled={loading}
                    />
                  </div>

                  <div className="flex space-x-4">
                    <Button type="submit" className="flex-1" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Submit Request
                        </>
                      )}
                    </Button>
                    <Button type="button" variant="outline" asChild disabled={loading}>
                      <Link href="/dashboard?role=student">Cancel</Link>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <p className="text-sm text-muted-foreground">{currentUser?.name || "Loading..."}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm text-muted-foreground">{currentUser?.email || "Loading..."}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Role</Label>
                  <p className="text-sm text-muted-foreground capitalize">{currentUser?.role || "Loading..."}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tips for Better Service</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <p className="font-medium mb-1">Be Specific</p>
                  <p className="text-muted-foreground">Provide exact location and detailed description of the issue.</p>
                </div>
                <div className="text-sm">
                  <p className="font-medium mb-1">Include Photos</p>
                  <p className="text-muted-foreground">
                    If possible, take photos to help maintenance staff understand the problem.
                  </p>
                </div>
                <div className="text-sm">
                  <p className="font-medium mb-1">Set Realistic Expectations</p>
                  <p className="text-muted-foreground">Non-emergency requests typically take 1-3 business days.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Emergency Contact</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">For urgent issues that pose safety risks:</p>
                <p className="font-medium">Campus Security: (555) 123-4567</p>
                <p className="text-sm text-muted-foreground mt-2">Available 24/7 for emergencies</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
