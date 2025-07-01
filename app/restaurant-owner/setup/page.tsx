"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { doc, setDoc, getDoc, serverTimestamp, collection } from "firebase/firestore"
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"
import { auth, db, storage } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { log } from "@/lib/logging"
import { resizeAndCompress } from "@/lib/resize-image"
import { PlusCircle, ImageIcon } from "lucide-react"
import { useToast } from "@/components/ui/use-toast" // Import useToast

export default function RestaurantSetupPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [restaurantName, setRestaurantName] = useState("")
  const [description, setDescription] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [cuisine, setCuisine] = useState("") // Comma-separated string
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { toast } = useToast() // Initialize toast

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        const userDocRef = doc(db, "users", currentUser.uid)
        const userDocSnap = await getDoc(userDocRef)

        if (!userDocSnap.exists()) {
          await setDoc(userDocRef, {
            uid: currentUser.uid,
            email: currentUser.email ?? "",
            role: "user",
            isVerified: false,
            createdAt: serverTimestamp(),
          })
          log("info", "User profile auto-created during restaurant setup check", { uid: currentUser.uid })
        }

        const userData = userDocSnap.data()
        if (userData?.role !== "restaurant_owner") {
          log("warn", "Unauthorized access attempt to restaurant setup page", {
            uid: currentUser.uid,
            role: userData?.role,
          })
          toast({
            title: "⛔ Access Denied",
            description: "Not authorized to set up a restaurant.",
            variant: "destructive",
          })
          router.push("/") // Redirect if not a restaurant owner
        } else if (userData.restaurantId) {
          log("info", "Restaurant owner already has a restaurant, redirecting to dashboard", {
            uid: currentUser.uid,
            restaurantId: userData.restaurantId,
          })
          toast({
            title: "ℹ️ Already Setup",
            description: "Restaurant already registered.",
            variant: "default",
          })
          router.push("/restaurant-owner") // Redirect if already has a restaurant
        } else {
          setEmail(currentUser.email || "") // Pre-fill email
          setLoading(false)
        }
      } else {
        log("info", "No user logged in, redirecting to login for restaurant setup")
        router.push("/login")
      }
    })
    return () => unsubscribe()
  }, [router, toast])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0])
    }
  }

  const handleUploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null

    let blob: Blob
    try {
      blob = await resizeAndCompress(imageFile, { maxWidth: 1200, quality: 0.8 })
    } catch (err: any) {
      log("error", "Image resize/compression failed for restaurant image", {
        fileName: imageFile.name,
        error: err.message,
      })
      setError("🖼️ Image Error")
      toast({
        title: "🖼️ Image Error",
        description: "Could not process image.",
        variant: "destructive",
      })
      return null
    }

    if (blob.size > 4 * 1024 * 1024) {
      setError("📦 Too Large")
      toast({
        title: "📦 Too Large",
        description: "Image still too large (max 4 MB).",
        variant: "destructive",
      })
      return null
    }

    setUploading(true)
    const storageRef = ref(storage, `restaurant_images/${Date.now()}-${imageFile.name.replace(/\s+/g, "_")}`)
    try {
      const uploadTask = uploadBytesResumable(storageRef, blob)
      uploadTask.on("state_changed", (snap) => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100)
        log("debug", "Restaurant image upload progress", { fileName: imageFile.name, pct })
      })
      await uploadTask
      const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
      log("info", "Restaurant image uploaded successfully", { fileName: imageFile.name, downloadURL })
      return downloadURL
    } catch (err: any) {
      log("error", "Restaurant image upload failed", { fileName: imageFile.name, error: err.message })
      setError("❌ Upload Failed")
      toast({
        title: "❌ Upload Failed",
        description: "Could not upload image.",
        variant: "destructive",
      })
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    if (!user) {
      setError("🔒 Auth Error")
      toast({
        title: "🔒 Auth Error",
        description: "Please log in.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    if (!restaurantName || !description || !address || !phone || !email || !cuisine) {
      setError("⚠️ Missing Info")
      toast({
        title: "⚠️ Missing Info",
        description: "Fill all required fields.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    const imageUrl = await handleUploadImage()
    if (imageFile && !imageUrl) {
      setIsSubmitting(false)
      return // Stop if image upload failed (error already toasted)
    }

    try {
      const newRestaurantRef = doc(collection(db, "restaurants"))
      const restaurantData = {
        id: newRestaurantRef.id,
        name: restaurantName,
        description,
        address,
        phone,
        email,
        cuisine: cuisine
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
        imageUrl: imageUrl || "/placeholder.svg?height=400&width=600",
        rating: 0,
        totalReviews: 0,
        isActive: false, // Admin needs to approve
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
      await setDoc(newRestaurantRef, restaurantData)
      log("info", "New restaurant created", { restaurantId: newRestaurantRef.id, ownerId: user.uid })

      const userDocRef = doc(db, "users", user.uid)
      await setDoc(userDocRef, { restaurantId: newRestaurantRef.id }, { merge: true })
      log("info", "User profile updated with restaurantId", { uid: user.uid, restaurantId: newRestaurantRef.id })

      toast({
        title: "🎉 Registered!",
        description: "Restaurant registered. Awaiting approval.",
        variant: "default",
      })
      router.push("/restaurant-owner")
    } catch (err: any) {
      log("error", "Failed to register restaurant", { error: err.message, uid: user.uid })
      setError("❌ Registration Failed")
      toast({
        title: "❌ Registration Failed",
        description: "Could not register. Try again.",
        variant: "destructive",
      })
      console.error("Error registering restaurant:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="bg-white rounded-xl shadow-lg max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusCircle className="h-6 w-6" /> Register Your Restaurant
          </CardTitle>
          <CardDescription>
            Fill in the details below to register your restaurant. An admin will review and activate it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
            <div className="grid gap-2">
              <Label htmlFor="restaurantName">Restaurant Name</Label>
              <Input
                id="restaurantName"
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" type="text" value={address} onChange={(e) => setAddress(e.target.value)} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cuisine">Cuisine Types (comma-separated)</Label>
              <Input
                id="cuisine"
                type="text"
                placeholder="e.g., Indian, Chinese, Italian"
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image">Restaurant Image</Label>
              <Input id="image" type="file" accept="image/*" onChange={handleImageChange} />
              {imageFile && (
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <ImageIcon className="h-4 w-4" /> {imageFile.name}
                </p>
              )}
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <Button type="submit" disabled={uploading || isSubmitting}>
              {isSubmitting ? "Registering..." : uploading ? "Uploading Image..." : "Register Restaurant"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
