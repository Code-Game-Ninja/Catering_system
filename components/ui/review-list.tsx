// components/ui/review-list.tsx
"use client"

import { useState, useEffect } from "react"
import { collection, query, where, orderBy, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { StarRating } from "@/components/ui/star-rating"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { log } from "@/lib/logging"
import type { Review } from "@/lib/types"
import { ThumbsUp, MessageCircle, Star } from "lucide-react"

interface ReviewListProps {
  productId: string
  refreshTrigger?: number
}

export function ReviewList({ productId, refreshTrigger }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    fetchReviews()
  }, [productId, refreshTrigger])

  const fetchReviews = async () => {
    try {
      const reviewsCollection = collection(db, "reviews")
      const q = query(reviewsCollection, where("productId", "==", productId), orderBy("createdAt", "desc"))

      const querySnapshot = await getDocs(q)
      const reviewsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Review[]

      setReviews(reviewsList)
      log("info", "Reviews fetched successfully", { productId, count: reviewsList.length })
    } catch (err: any) {
      log("error", "Failed to fetch reviews", { productId, error: err.message })
      setError("Failed to load reviews")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return <p className="text-red-500 text-center">{error}</p>
  }

  const displayedReviews = showAll ? reviews : reviews.slice(0, 3)
  const averageRating =
    reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0

  return (
    <div className="space-y-6">
      {/* Reviews Summary */}
      {reviews.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold">{averageRating.toFixed(1)}</div>
                  <StarRating rating={averageRating} size="sm" />
                  <div className="text-sm text-gray-600 mt-1">
                    {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>

              {/* Rating Distribution */}
              <div className="flex-1 max-w-md ml-8">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = reviews.filter((r) => r.rating === star).length
                  const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0

                  return (
                    <div key={star} className="flex items-center gap-2 text-sm">
                      <span className="w-3">{star}</span>
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${percentage}%` }} />
                      </div>
                      <span className="w-8 text-right">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Reviews */}
      {reviews.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-600">No reviews yet</p>
            <p className="text-sm text-gray-500">Be the first to review this product!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {displayedReviews.map((review) => (
            <Card key={review.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{review.userName.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{review.userName}</p>
                      <div className="flex items-center gap-2">
                        <StarRating rating={review.rating} size="sm" />
                        <span className="text-sm text-gray-500">{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-700 leading-relaxed">{review.comment}</p>

                {/* Helpful button (placeholder for future functionality) */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                  <Button variant="ghost" size="sm" className="text-gray-500">
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    Helpful ({review.helpful})
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {reviews.length > 3 && (
            <div className="text-center">
              <Button variant="outline" onClick={() => setShowAll(!showAll)}>
                {showAll ? "Show Less" : `Show All ${reviews.length} Reviews`}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
