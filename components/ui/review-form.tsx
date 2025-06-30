// components/ui/review-form.tsx
"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StarRating } from "@/components/ui/star-rating"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { log } from "@/lib/logging"
import type { Review } from "@/lib/types"

interface ReviewFormProps {
  productId?: string
  restaurantId?: string
  userId: string
  userName: string
  userEmail: string
  onReviewSubmitted: () => void
}

export function ReviewForm({ productId, restaurantId, userId, userName, userEmail, onReviewSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      setError("Please select a rating")
      return
    }

    if (comment.trim().length < 10) {
      setError("Please write at least 10 characters in your review")
      return
    }

    if (!productId && !restaurantId) {
      setError("Invalid review target.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const reviewData: Omit<Review, "id"> = {
        ...(productId ? { productId } : {}),
        ...(restaurantId ? { restaurantId } : {}),
        userId,
        userName: userName || "Anonymous",
        userEmail,
        rating,
        comment: comment.trim(),
        createdAt: new Date(),
        helpful: 0,
      }

      await addDoc(collection(db, "reviews"), {
        ...reviewData,
        createdAt: serverTimestamp(),
      })

      log("info", "Review submitted successfully", { productId, restaurantId, userId, rating })

      // Reset form
      setRating(0)
      setComment("")
      onReviewSubmitted()
    } catch (err: any) {
      log("error", "Failed to submit review", { productId, restaurantId, userId, error: err.message })
      setError("Failed to submit review. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Write a Review</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Your Rating</Label>
            <div className="mt-2">
              <StarRating rating={rating} interactive={true} onRatingChange={setRating} size="lg" />
            </div>
          </div>

          <div>
            <Label htmlFor="comment">Your Review</Label>
            <Textarea
              id="comment"
              placeholder="Share your experience with this product..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="mt-2"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Submitting..." : "Submit Review"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
