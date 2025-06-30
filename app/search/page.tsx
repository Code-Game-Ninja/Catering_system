// app/search/page.tsx
"use client"

import { useState, useEffect } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Product, Restaurant } from "@/lib/types"
import { ProductCard } from "@/components/ui/product-card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { log } from "@/lib/logging"
import { SearchIcon, UtensilsCrossed, ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const initialSearchTerm = searchParams.get("q") || ""

  const [products, setProducts] = useState<Product[]>([])
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedRestaurant, setSelectedRestaurant] = useState("all")
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()

  useEffect(() => {
    const fetchSearchData = async () => {
      try {
        // Fetch restaurants first
        const restaurantsCollection = collection(db, "restaurants")
        const restaurantSnapshot = await getDocs(restaurantsCollection)
        const restaurantsList = restaurantSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Restaurant[]
        setRestaurants(restaurantsList.filter((r) => r.isActive)) // Only show active restaurants

        // Fetch products
        const productsCollection = collection(db, "products")
        const productSnapshot = await getDocs(productsCollection)
        const productsList = productSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        })) as Product[]
        setProducts(productsList)
        log("info", "Search page fetched products and restaurants successfully", {
          productsCount: productsList.length,
          restaurantsCount: restaurantsList.length,
        })
      } catch (err: any) {
        log("error", "Failed to fetch search data", { error: err.message })
        setError("Failed to load search results. Please try again later.")
        console.error("Error fetching search data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchSearchData()
  }, [])

  const getUniqueCategories = () => {
    const categories = new Set<string>()
    products.forEach((product) => {
      if (product.category) {
        categories.add(product.category)
      }
    })
    return Array.from(categories).sort()
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.restaurantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    const matchesRestaurant = selectedRestaurant === "all" || product.restaurantId === selectedRestaurant

    // Only show products from active restaurants
    const isRestaurantActive = restaurants.find((r) => r.id === product.restaurantId)?.isActive

    return matchesSearch && matchesCategory && matchesRestaurant && isRestaurantActive
  })

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-8">
        <Button variant="back" onClick={() => router.back()} className="p-2 md:hidden">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-semibold">Search</h1>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SearchIcon className="h-5 w-5" /> Refine Your Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name, description, restaurant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {getUniqueCategories().map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Restaurant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Restaurants</SelectItem>
                {restaurants.map((restaurant) => (
                  <SelectItem key={restaurant.id} value={restaurant.id}>
                    {restaurant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <UtensilsCrossed className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-600">No products found matching your search criteria.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
