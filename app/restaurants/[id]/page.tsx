// app/restaurants/[id]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Restaurant, Product } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { log } from "@/lib/logging"
import Image from "next/image"
import { StarRating } from "@/components/ui/star-rating"
import { MapPin, Phone, Mail, UtensilsCrossed, ArrowLeft, Package } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ProductCard } from "@/components/ui/product-card"
import { useRouter } from "next/navigation"
import { ReviewForm } from "@/components/ui/review-form"
import { ReviewList } from "@/components/ui/review-list"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"

interface RestaurantPageProps {
  params: {
    id: string
  }
}

export default function RestaurantPage({ params }: RestaurantPageProps) {
  const { id } = params
  const router = useRouter()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const fetchRestaurantData = async () => {
      try {
        // Fetch restaurant details
        const restaurantDocRef = doc(db, "restaurants", id)
        const restaurantDocSnap = await getDoc(restaurantDocRef)

        if (!restaurantDocSnap.exists()) {
          setError("Restaurant not found.")
          setLoading(false)
          log("warn", "Restaurant not found", { restaurantId: id })
          return
        }

        const restaurantData = {
          id: restaurantDocSnap.id,
          ...restaurantDocSnap.data(),
          createdAt: restaurantDocSnap.data().createdAt?.toDate(),
          updatedAt: restaurantDocSnap.data().updatedAt?.toDate(),
        } as Restaurant

        if (!restaurantData.isActive) {
          setError("This restaurant is currently inactive or not approved.")
          setLoading(false)
          log("warn", "Inactive restaurant accessed", { restaurantId: id })
          return
        }

        setRestaurant(restaurantData)
        log("info", "Restaurant fetched successfully", { restaurantId: id })

        // Fetch products for this restaurant
        const productsCollection = collection(db, "products")
        const q = query(productsCollection, where("restaurantId", "==", id), where("isAvailable", "==", true))
        const productSnapshot = await getDocs(q)
        const productsList = productSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        })) as Product[]
        setProducts(productsList)
        log("info", "Products fetched for restaurant", { restaurantId: id, count: productsList.length })
      } catch (err: any) {
        log("error", "Failed to fetch restaurant or products", { restaurantId: id, error: err.message })
        setError("Failed to load restaurant details. Please try again later.")
        console.error("Error fetching restaurant or products:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchRestaurantData()
  }, [id])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid))
        setCurrentUser({
          uid: user.uid,
          name: userDoc.data()?.name || user.email?.split("@")[0] || "Anonymous",
          email: user.email || "",
        })
      } else {
        setCurrentUser(null)
      }
    })
    return () => unsubscribe()
  }, [])

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
        <p className="text-red-500">{error}</p>
        <Button onClick={() => router.back()} className="ml-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
        <p className="text-gray-600">Restaurant not found.</p>
        <Button onClick={() => router.back()} className="ml-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="flex items-center gap-2 mb-8">
        <Button variant="back" onClick={() => router.back()} className="p-2 md:hidden">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back
        </Button>
        <h1 className="text-2xl font-semibold">{restaurant.name}</h1>
      </div>

      {/* Restaurant Header */}
      <Card className="mb-8">
        <CardContent className="grid md:grid-cols-3 gap-6 p-6">
          <div className="relative h-64 w-full overflow-hidden rounded-lg md:col-span-1">
            <Image
              src={restaurant.imageUrl || "/placeholder.svg?height=400&width=600"}
              alt={restaurant.name}
              layout="fill"
              objectFit="cover"
              className="transition-transform duration-300 hover:scale-105"
            />
          </div>
          <div className="md:col-span-2 flex flex-col justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">{restaurant.name}</h1>
              <div className="flex items-center gap-2 mb-4">
                <StarRating rating={restaurant.rating || 0} totalReviews={restaurant.totalReviews || 0} />
                <span className="text-sm text-gray-600">({restaurant.totalReviews || 0} reviews)</span>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">{restaurant.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {restaurant.cuisine.map((c) => (
                  <Badge key={c} variant="secondary" className="flex items-center gap-1">
                    <UtensilsCrossed className="h-4 w-4" /> {c}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{restaurant.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>{restaurant.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>{restaurant.email}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Restaurant Menu */}
      <h2 className="text-3xl font-bold mb-6 text-center flex items-center justify-center gap-2">
        <Package className="h-7 w-7" /> Our Menu
      </h2>
      {products.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <UtensilsCrossed className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-600">This restaurant has no active menu items yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Restaurant Reviews */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Customer Reviews</h2>
        <ReviewList restaurantId={restaurant.id} />
        <div className="mt-8">
          {currentUser ? (
            <ReviewForm
              restaurantId={restaurant.id}
              userId={currentUser.uid}
              userName={currentUser.name}
              userEmail={currentUser.email}
              onReviewSubmitted={() => {}}
            />
          ) : (
            <div className="text-center text-gray-600">
              <p>You must be logged in to leave a review.</p>
              <Button className="mt-2" onClick={() => router.push("/login")}>Login</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
