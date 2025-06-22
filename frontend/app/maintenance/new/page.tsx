"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, ArrowLeft, Send } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

const categories = [
  { id: 1, name: "Plumbing", description: "Water, drainage, and pipe issues" },
  { id: 2, name: "Electrical", description: "Lighting, outlets, and electrical problems" },
  { id: 3, name: "HVAC", description: "Heating, ventilation, and air conditioning" },
  { id: 4, name: "Furniture", description: "Bed, desk, chair, and furniture repairs" },
  { id: 5, name: "Cleaning", description: "Deep cleaning and sanitation requests" },
  { id: 6, name: "Security", description: "Locks, keys, and security-related issues" },
  { id: 7, name: "Other", description: "Other maintenance needs" },
]

export default function NewMaintenanceRequestPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    category: "",
    description: "",
    availability: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically send the data to your API
    console.log("Submitting maintenance request:", formData)

    // Simulate API call
    setTimeout(() => {
      router.push("/dashboard?role=student")
    }, 1000)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.name}>
                            <div>
                              <div className="font-medium">{category.name}</div>
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
                    />
                  </div>

                  <div className="flex space-x-4">
                    <Button type="submit" className="flex-1">
                      <Send className="h-4 w-4 mr-2" />
                      Submit Request
                    </Button>
                    <Button type="button" variant="outline" asChild>
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
                  <p className="text-sm text-muted-foreground">John Doe</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Room</Label>
                  <p className="text-sm text-muted-foreground">A-101</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Hall</Label>
                  <p className="text-sm text-muted-foreground">North Hall</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Contact</Label>
                  <p className="text-sm text-muted-foreground">john.doe@university.edu</p>
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
