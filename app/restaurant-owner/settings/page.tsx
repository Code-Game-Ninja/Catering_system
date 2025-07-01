"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { auth, db, storage } from "@/lib/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import type { Restaurant, UserProfile } from "@/lib/types"
import { log } from "@/lib/logging"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import Image from "next/image"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { resizeAndCompress } from "@/lib/resize-image" // Correct import
import { useToast } from "@/components/ui/use-toast" // Import useToast

export default function RestaurantSettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast() // Initialize toast

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        await fetchUserProfileAndRestaurant(currentUser.uid)
      } else {
        log("info", "No user logged in, redirecting to login for restaurant settings")
        router.push("/login")
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [router])

  const fetchUserProfileAndRestaurant = async (uid: string) => {
    try {
      const userDocRef = doc(db, "users", uid)
      const userDocSnap = await getDoc(userDocRef)
      if (userDocSnap.exists()) {
        const profile = userDocSnap.data() as UserProfile
        setUserProfile(profile)
        if (profile.role === "restaurant_owner" && profile.restaurantId) {
          const restaurantDocRef = doc(db, "restaurants", profile.restaurantId)
          const restaurantDocSnap = await getDoc(restaurantDocRef)
          if (restaurantDocSnap.exists()) {
            setRestaurant(restaurantDocSnap.data() as Restaurant)
            setPreviewImage(restaurantDocSnap.data().imageUrl || null)
            log("info", "Restaurant data fetched for owner settings", { restaurantId: profile.restaurantId })
          } else {
            log("warn", "Restaurant document not found for owner", { restaurantId: profile.restaurantId })
            setError("Restaurant data not found. Please set up your restaurant first.")
            router.push("/restaurant-owner/setup")
          }
        } else {
          log("warn", "User is not a restaurant owner or missing restaurantId", { uid, role: profile.role })
          setError("Access Denied: You are not authorized to view this page.")
          router.push("/")
        }
      } else {
        log("warn", "User profile not found for current user", { uid })
        setError("User profile not found.")
        router.push("/login")
      }
    } catch (err: any) {
      log("error", "Failed to fetch user profile or restaurant data", { uid, error: err.message })
      setError("Failed to load settings. Please try again.")
      toast({
        title: "❌ Error",
        description: "Could not load settings.",
        variant: "destructive",
      })
      console.error("Error fetching data:", err)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setRestaurant((prev) => (prev ? { ...prev, [name]: value } : null))
  }

  const handleCuisineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    setRestaurant((prev) => (prev ? { ...prev, cuisine: value.split(",").map((s) => s.trim()) } : null))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      setPreviewImage(URL.createObjectURL(file))
    }
  }

  const handleUploadImage = async (file: File, restaurantId: string) => {
    try {
      const compressedImage = await resizeAndCompress(file, 800, 600, 0.8) // Max 800px width, 600px height, 80% quality
      const storageRef = ref(storage, `restaurant_images/${restaurantId}-${file.name}`)
      await uploadBytes(storageRef, compressedImage)
      const imageUrl = await getDownloadURL(storageRef)
      log("info", "Restaurant image uploaded successfully", { fileName: file.name, imageUrl })
      return imageUrl
    } catch (err: any) {
      log("error", "Restaurant image upload failed", { fileName: file.name, error: err.message })
      toast({
        title: "❌ Upload Failed",
        description: "Could not upload image.",
        variant: "destructive",
      })
      throw err
    }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !restaurant || !userProfile?.restaurantId) return

    setLoading(true)
    setError(null)

    try {
      let updatedImageUrl = restaurant.imageUrl

      if (imageFile) {
        updatedImageUrl = await handleUploadImage(imageFile, userProfile.restaurantId)
      }

      const restaurantDocRef = doc(db, "restaurants", userProfile.restaurantId)
      await updateDoc(restaurantDocRef, {
        ...restaurant,
        imageUrl: updatedImageUrl,
        updatedAt: new Date(),
      })

      log("info", "Restaurant settings updated successfully", { restaurantId: userProfile.restaurantId })
      toast({
        title: "✅ Saved!",
        description: "Settings updated.",
        variant: "default",
      })
      // Clear image file and preview after successful upload/save
      setImageFile(null)
      setPreviewImage(updatedImageUrl)
    } catch (err: any) {
      log("error", "Failed to update restaurant settings", {
        restaurantId: userProfile.restaurantId,
        error: err.message,
      })
      setError("Failed to save settings. Please try again.")
      toast({
        title: "❌ Save Failed",
        description: "Could not save settings.",
        variant: "destructive",
      })
      console.error("Error saving settings:", err)
    } finally {
      setLoading(false)
    }
  }

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

  if (!restaurant) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
        <p className="text-gray-600">No restaurant data found. Please set up your restaurant.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="bg-white rounded-xl shadow-lg w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl text-center">Restaurant Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveSettings} className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="name">Restaurant Name</Label>
              <Input id="name" name="name" type="text" value={restaurant.name} onChange={handleInputChange} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={restaurant.description}
                onChange={handleInputChange}
                rows={4}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                type="text"
                value={restaurant.address}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={restaurant.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={restaurant.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cuisine">Cuisine (comma-separated)</Label>
              <Input
                id="cuisine"
                name="cuisine"
                type="text"
                value={restaurant.cuisine.join(", ")}
                onChange={handleCuisineChange}
                placeholder="e.g., Indian, Chinese, Italian"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="imageUrl">Restaurant Image</Label>
              <Input id="imageUrl" type="file" accept="image/*" onChange={handleImageChange} />
              {previewImage && (
                <div className="mt-2">
                  <Image
                    src={previewImage || "/placeholder.svg"}
                    alt="Restaurant Preview"
                    width={200}
                    height={150}
                    className="rounded-md object-cover"
                  />
                </div>
              )}
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="isActive">Active Status</Label>
              <Switch
                id="isActive"
                checked={restaurant.isActive}
                onCheckedChange={(checked) => setRestaurant((prev) => (prev ? { ...prev, isActive: checked } : null))}
              />
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving..." : "Save Settings"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
