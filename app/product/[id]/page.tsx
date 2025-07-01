"use client"

import { useState, useEffect } from "react"
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Product, Review, Restaurant } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { log } from "@/lib/logging"
import Image from "next/image"
import { StarRating } from "@/components/ui/star-rating"
import { ReviewForm } from "@/components/ui/review-form"
import { ReviewList } from "@/components/ui/review-list"
import {
  ShoppingCart,
  UtensilsCrossed,
  Clock,
  Flame,
  Leaf,
  Vegan,
  Info,
  Store,
  MapPin,
  Phone,
  Mail,
  ArrowLeft,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import type { UserProfile } from "@/lib/types"
import { useRouter } from "next/navigation"

interface ProductPageProps {
  params: {
    id: string
  }
}

export default function ProductPage({ params }: ProductPageProps) {
  const { id } = params
  const [product, setProduct] = useState<Product | null>(null)
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const router = useRouter()

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid)
          const userDocSnap = await getDoc(userDocRef)
          if (userDocSnap.exists()) {
            setUserProfile(userDocSnap.data() as UserProfile)
          }
        } catch (err) {
          log("warn", "Failed to fetch user profile for product page", { uid: currentUser.uid })
        }
      }
    })

    const fetchProductAndReviews = async () => {
      try {
        // Fetch product
        const productDocRef = doc(db, "products", id)
        const productDocSnap = await getDoc(productDocRef)

        if (!productDocSnap.exists()) {
          setError("Product not found.")
          setLoading(false)
          log("warn", "Product not found", { productId: id })
          return
        }

        const productData = {
          id: productDocSnap.id,
          ...productDocSnap.data(),
          createdAt: productDocSnap.data().createdAt?.toDate(),
          updatedAt: productDocSnap.data().updatedAt?.toDate(),
        } as Product
        setProduct(productData)
        log("info", "Product fetched successfully", { productId: id })

        // Fetch restaurant details
        if (productData.restaurantId) {
          const restaurantDocRef = doc(db, "restaurants", productData.restaurantId)
          const restaurantDocSnap = await getDoc(restaurantDocRef)
          if (restaurantDocSnap.exists()) {
            setRestaurant({
              id: restaurantDocSnap.id,
              ...restaurantDocSnap.data(),
              createdAt: restaurantDocSnap.data().createdAt?.toDate(),
              updatedAt: restaurantDocSnap.data().updatedAt?.toDate(),
            } as Restaurant)
            log("info", "Restaurant details fetched for product", { restaurantId: productData.restaurantId })
          } else {
            log("warn", "Restaurant not found for product", { productId: id, restaurantId: productData.restaurantId })
          }
        }

        // Fetch reviews for the product
        const reviewsCollection = collection(db, "reviews")
        const q = query(reviewsCollection, where("productId", "==", id))
        const reviewSnapshot = await getDocs(q)
        const reviewsList = reviewSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
        })) as Review[]
        setReviews(reviewsList)
        log("info", "Reviews fetched successfully", { productId: id, count: reviewsList.length })
      } catch (err: any) {
        log("error", "Failed to fetch product or reviews", { productId: id, error: err.message })
        setError("Failed to load product details. Please try again later.")
        console.error("Error fetching product or reviews:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchProductAndReviews()

    return () => unsubscribeAuth()
  }, [id])

  const handleReviewSubmitted = (newReview: Review) => {
    setReviews((prevReviews) => [newReview, ...prevReviews])
    // Optionally, update product's average rating and total reviews here
  }

  const handleAddToCart = () => {
    if (!product) {
      log("warn", "Attempted to add null product to cart")
      setError("Product details are missing.")
      return
    }

    try {
      const currentCart = JSON.parse(localStorage.getItem("cart") || "[]")
      const existingItemIndex = currentCart.findIndex((item: any) => item.productId === product.id)

      if (existingItemIndex > -1) {
        currentCart[existingItemIndex].quantity += 1
      } else {
        currentCart.push({
          productId: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
          quantity: 1,
          restaurantId: product.restaurantId,
          restaurantName: product.restaurantName,
        })
      }

      localStorage.setItem("cart", JSON.stringify(currentCart))
      log("info", "Product added to cart from detail page", { productId: product.id })
      setError("Item added to cart.")
    } catch (e: any) {
      log("error", "Failed to add product to cart (localStorage error)", { productId: product.id, error: e.message })
      setError("Failed to add product to cart. Please try again or clear your browser's local storage.")
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
        <p className="text-red-500">{error}</p>
        <Button onClick={() => window.history.back()} className="ml-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
        <p className="text-gray-600">Product not found.</p>
        <Button onClick={() => window.history.back()} className="ml-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => window.history.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card className="mb-8 bg-white rounded-xl shadow-lg">
        <CardContent className="grid md:grid-cols-2 gap-8 p-6">
          <div className="relative h-80 w-full overflow-hidden rounded-lg">
            <Image
              src={product.imageUrl || "/placeholder.svg"}
              alt={product.name}
              layout="fill"
              objectFit="cover"
              className="transition-transform duration-300 hover:scale-105"
            />
          </div>
          <div className="flex flex-col justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">{product.name}</h1>
              {restaurant && (
                <Link
                  href={`/restaurants/${restaurant.id}`}
                  className="flex items-center gap-2 text-lg text-gray-600 hover:underline mb-4"
                >
                  <Store className="h-5 w-5" /> {restaurant.name}
                </Link>
              )}
              <p className="text-2xl font-semibold text-[var(--primary)] mb-4">${product.price.toFixed(2)}</p>
              <p className="text-gray-700 mb-4">{product.description}</p>

              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <UtensilsCrossed className="h-4 w-4" /> {product.category}
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="h-4 w-4" /> {product.preparationTime} min
                </Badge>
                {product.spiceLevel && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Flame className="h-4 w-4" /> {product.spiceLevel}
                  </Badge>
                )}
                {product.isVegetarian && (
                  <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-800">
                    <Leaf className="h-4 w-4" /> Vegetarian
                  </Badge>
                )}
                {product.isVegan && (
                  <Badge variant="secondary" className="flex items-center gap-1 bg-green-200 text-green-900">
                    <Vegan className="h-4 w-4" /> Vegan
                  </Badge>
                )}
                {product.isAvailable ? (
                  <Badge className="flex items-center gap-1 bg-green-500 text-white">
                    <Info className="h-4 w-4" /> Available
                  </Badge>
                ) : (
                  <Badge className="flex items-center gap-1 bg-red-500 text-white">
                    <Info className="h-4 w-4" /> Unavailable
                  </Badge>
                )}
              </div>

              {product.ingredients && product.ingredients.length > 0 && (
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-semibold">Ingredients:</span> {product.ingredients.join(", ")}
                </p>
              )}
              {product.allergens && product.allergens.length > 0 && (
                <p className="text-sm text-red-500 mb-4">
                  <span className="font-semibold">Allergens:</span> {product.allergens.join(", ")}
                </p>
              )}

              <div className="flex items-center gap-2 mb-4">
                <StarRating rating={product.averageRating || 0} />
                <span className="text-sm text-gray-600">({product.totalReviews || 0} reviews)</span>
              </div>
            </div>
            {user ? (
              <Button className="w-full py-3 text-lg" onClick={handleAddToCart}>
                <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
              </Button>
            ) : (
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-600 mb-2">Please log in to add items to cart</p>
                <Button onClick={() => router.push("/login")}>Login</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {restaurant && (
        <Card className="mb-8 bg-white rounded-xl shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-6 w-6" /> About {restaurant.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">{restaurant.description}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[var(--muted-foreground)]" />
                <span>{restaurant.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[var(--muted-foreground)]" />
                <span>{restaurant.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[var(--muted-foreground)]" />
                <span>{restaurant.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="h-4 w-4 text-[var(--muted-foreground)]" />
                <span>{restaurant.cuisine.join(", ")}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-white rounded-xl shadow-lg">
        <CardHeader>
          <CardTitle>Customer Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          {user && userProfile ? (
            <ReviewForm
              productId={product.id}
              userId={userProfile?.uid || user?.uid || ""}
              userName={userProfile?.name || user?.displayName || user?.email?.split("@")[0] || "Anonymous"}
              userEmail={userProfile?.email || user?.email || ""}
              onReviewSubmitted={() => {}}
            />
          ) : (
            <div className="text-center p-4 bg-gray-50 rounded-lg mb-6">
              <p className="text-gray-600 mb-2">Please log in to leave a review.</p>
              <Button onClick={() => router.push("/login")}>Login to Review</Button>
            </div>
          )}
          <ReviewList productId={id} />
        </CardContent>
      </Card>
    </div>
  )
}
