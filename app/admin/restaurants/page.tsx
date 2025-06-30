"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, doc, updateDoc, query, orderBy, setDoc, getDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { useRouter } from "next/navigation"
import type { Restaurant } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { log } from "@/lib/logging"
import Image from "next/image"
import { Search, Filter, Eye, Store, Star, Phone, Mail, MapPin, CheckCircle, XCircle, Edit, ArrowLeft } from "lucide-react" // Import Edit icon and ArrowLeft icon
import { EditRestaurantModal } from "@/components/admin/edit-restaurant-modal" // Import the new modal

export default function AdminRestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<"user" | "restaurant_owner" | "admin" | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [cuisineFilter, setCuisineFilter] = useState<string>("all")
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const [updatingRestaurantId, setUpdatingRestaurantId] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false) // State for modal visibility
  const [restaurantToEdit, setRestaurantToEdit] = useState<Restaurant | null>(null) // State for restaurant being edited
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid)
        const userDocSnap = await getDoc(userDocRef)

        if (!userDocSnap.exists()) {
          await setDoc(userDocRef, {
            uid: user.uid,
            email: user.email ?? "",
            role: "user",
            isVerified: false,
            createdAt: new Date(),
          })
        }

        const userData = (await getDoc(userDocRef)).data()
        if (userData?.role === "admin") {
          setUserRole("admin")
          fetchRestaurants()
        } else {
          log("warn", "Unauthorized access attempt to admin restaurants page", { uid: user.uid })
          router.push("/")
        }
      } else {
        router.push("/login")
      }
    })
    return () => unsubscribe()
  }, [router])

  const fetchRestaurants = async () => {
    try {
      const restaurantsCollection = collection(db, "restaurants")
      const q = query(restaurantsCollection, orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(q)

      const restaurantsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Restaurant[]

      setRestaurants(restaurantsList)
      setFilteredRestaurants(restaurantsList)
      log("info", "Admin fetched restaurants successfully", { count: restaurantsList.length })
    } catch (err: any) {
      log("error", "Admin failed to fetch restaurants", { error: err.message })
      setError("Failed to load restaurants. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  const updateRestaurantStatus = async (restaurantId: string, isActive: boolean) => {
    setUpdatingRestaurantId(restaurantId)
    try {
      const restaurantRef = doc(db, "restaurants", restaurantId)
      await updateDoc(restaurantRef, { isActive, updatedAt: new Date() })

      const updatedRestaurants = restaurants.map((restaurant) =>
        restaurant.id === restaurantId ? { ...restaurant, isActive } : restaurant,
      )
      setRestaurants(updatedRestaurants)
      applyFilters(updatedRestaurants, searchTerm, statusFilter, cuisineFilter)

      log("info", "Restaurant status updated successfully", { restaurantId, isActive })
    } catch (err: any) {
      log("error", "Failed to update restaurant status", { restaurantId, isActive, error: err.message })
      setError("Failed to update restaurant status. Please try again.")
    } finally {
      setUpdatingRestaurantId(null)
    }
  }

  const handleEditClick = (restaurant: Restaurant) => {
    setRestaurantToEdit(restaurant)
    setIsEditModalOpen(true)
  }

  const handleSaveEditedRestaurant = (updatedRestaurant: Restaurant) => {
    // Update the main restaurants list with the saved data
    const updatedRestaurants = restaurants.map((r) => (r.id === updatedRestaurant.id ? updatedRestaurant : r))
    setRestaurants(updatedRestaurants)
    applyFilters(updatedRestaurants, searchTerm, statusFilter, cuisineFilter) // Re-apply filters to update filtered list
  }

  const applyFilters = (restaurantsList: Restaurant[], search: string, status: string, cuisine: string) => {
    let filtered = [...restaurantsList]

    if (search.trim()) {
      filtered = filtered.filter(
        (restaurant) =>
          restaurant.name.toLowerCase().includes(search.toLowerCase()) ||
          restaurant.email.toLowerCase().includes(search.toLowerCase()) ||
          restaurant.address.toLowerCase().includes(search.toLowerCase()) ||
          restaurant.cuisine.some((c) => c.toLowerCase().includes(search.toLowerCase())),
      )
    }

    if (status !== "all") {
      filtered = filtered.filter((restaurant) => {
        if (status === "active") return restaurant.isActive
        if (status === "inactive") return !restaurant.isActive
        return true
      })
    }

    if (cuisine !== "all") {
      filtered = filtered.filter((restaurant) => restaurant.cuisine.includes(cuisine))
    }

    setFilteredRestaurants(filtered)
  }

  useEffect(() => {
    applyFilters(restaurants, searchTerm, statusFilter, cuisineFilter)
  }, [searchTerm, statusFilter, cuisineFilter, restaurants])

  const getAllCuisines = () => {
    const cuisines = new Set<string>()
    restaurants.forEach((restaurant) => {
      restaurant.cuisine.forEach((c) => cuisines.add(c))
    })
    return Array.from(cuisines).sort()
  }

  if (loading || userRole === null) {
    return <LoadingSpinner />
  }

  if (userRole !== "admin") {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
        <p className="text-red-500">Access Denied. You are not authorized to view this page.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-4xl font-bold">Restaurant Management</h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Store className="h-4 w-4" />
          <span>{filteredRestaurants.length} restaurants</span>
        </div>
      </div>

      {/* Filters Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Restaurants</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Name, email, address, cuisine..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cuisine Type</Label>
              <Select value={cuisineFilter} onValueChange={setCuisineFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All cuisines" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cuisines</SelectItem>
                  {getAllCuisines().map((cuisine) => (
                    <SelectItem key={cuisine} value={cuisine}>
                      {cuisine}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Actions</Label>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("all")
                  setCuisineFilter("all")
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Restaurants List */}
      {filteredRestaurants.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-600">
              {restaurants.length === 0 ? "No restaurants found." : "No restaurants match your current filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredRestaurants.map((restaurant) => (
            <Card key={restaurant.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                    <Image
                      src={restaurant.imageUrl || "/placeholder.svg?height=80&width=80"}
                      alt={restaurant.name}
                      width={80}
                      height={80}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="w-full">
                      <CardTitle className="text-xl break-words">{restaurant.name}</CardTitle>
                      <div className="flex flex-wrap gap-2 text-sm text-gray-600 mt-1">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {restaurant.address}
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          {restaurant.rating?.toFixed(1) || "N/A"} ({restaurant.totalReviews || 0})
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {restaurant.cuisine.map((c) => (
                          <Badge key={c} variant="secondary" className="text-xs">
                            {c}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge
                      className={`flex items-center gap-1 ${
                        restaurant.isActive
                          ? "bg-green-100 text-green-800 border-green-200"
                          : "bg-red-100 text-red-800 border-red-200"
                      }`}
                    >
                      {restaurant.isActive ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      {restaurant.isActive ? "Active" : "Inactive"}
                    </Badge>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setSelectedRestaurant(selectedRestaurant?.id === restaurant.id ? null : restaurant)
                      }
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {selectedRestaurant?.id === restaurant.id ? "Hide" : "View"} Details
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEditClick(restaurant)}>
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {selectedRestaurant?.id === restaurant.id && (
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Restaurant Information */}
                    <div>
                      <h3 className="font-semibold mb-3">Restaurant Information</h3>
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="font-medium">Description:</span> {restaurant.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>{restaurant.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{restaurant.phone}</span>
                        </div>
                        <p>
                          <span className="font-medium">Owner ID:</span> {restaurant.ownerId}
                        </p>
                        <p>
                          <span className="font-medium">Created:</span> {restaurant.createdAt ? new Date(restaurant.createdAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Restaurant Status Management */}
                    <div>
                      <h3 className="font-semibold mb-3">Restaurant Status</h3>
                      <div className="flex items-center gap-2">
                        <Select
                          value={restaurant.isActive ? "active" : "inactive"}
                          onValueChange={(value) => updateRestaurantStatus(restaurant.id, value === "active")}
                          disabled={updatingRestaurantId === restaurant.id}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                        {updatingRestaurantId === restaurant.id && (
                          <div className="text-sm text-gray-500">Updating...</div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {restaurant.isActive
                          ? "Restaurant is visible to customers and can receive orders"
                          : "Restaurant is hidden from customers and cannot receive orders"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {restaurantToEdit && (
        <EditRestaurantModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          restaurant={restaurantToEdit}
          onSave={handleSaveEditedRestaurant}
        />
      )}
    </div>
  )
}
