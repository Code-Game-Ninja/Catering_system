"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { doc, getDoc, updateDoc, serverTimestamp, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { log } from "@/lib/logging"
import { User, Mail, Phone, MapPin, Utensils, ArrowLeft } from "lucide-react"
import { useToast } from "@/components/ui/use-toast" // Import useToast

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [role, setRole] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast() // Initialize toast

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        const userDocRef = doc(db, "users", currentUser.uid)
        const userDocSnap = await getDoc(userDocRef)

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data()
          setDisplayName(userData?.displayName || currentUser.displayName || "")
          setEmail(userData?.email || currentUser.email || "")
          setPhone(userData?.phone || "")
          setAddress(userData?.address || "")
          setRole(userData?.role || "user")
          log("info", "User profile data loaded", { uid: currentUser.uid })
        } else {
          // Create basic profile if it doesn't exist
          await setDoc(userDocRef, {
            uid: currentUser.uid,
            email: currentUser.email ?? "",
            role: "user",
            isVerified: false,
            createdAt: serverTimestamp(),
          })
          setDisplayName(currentUser.displayName || "")
          setEmail(currentUser.email || "")
          setRole("user")
          log("info", "User profile auto-created during profile page load", { uid: currentUser.uid })
        }
        setLoading(false)
      } else {
        log("info", "No user logged in, redirecting to login for profile page")
        router.push("/login")
      }
    })
    return () => unsubscribe()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    if (!user) {
      setError("User not authenticated.")
      toast({
        title: "Authentication Error",
        description: "User not authenticated. Please log in.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    try {
      const userDocRef = doc(db, "users", user.uid)
      await updateDoc(userDocRef, {
        displayName,
        email,
        phone,
        address,
        updatedAt: serverTimestamp(),
      })
      log("info", "User profile updated successfully", { uid: user.uid })
      toast({
        title: "Profile Updated!",
        description: "Your profile information has been saved.",
        variant: "default",
      })
    } catch (err: any) {
      log("error", "Failed to update user profile", { error: err.message, uid: user.uid })
      setError("Failed to update profile. Please try again.")
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
      console.error("Error updating profile:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBecomeRestaurantOwner = async () => {
    if (!user) {
      setError("User not authenticated.")
      toast({
        title: "Authentication Error",
        description: "User not authenticated. Please log in.",
        variant: "destructive",
      })
      return
    }

    if (confirm("Are you sure you want to register as a restaurant owner? You will be redirected to the setup page.")) {
      setIsSubmitting(true)
      try {
        const userDocRef = doc(db, "users", user.uid)
        await updateDoc(userDocRef, {
          role: "restaurant_owner",
          updatedAt: serverTimestamp(),
        })
        setRole("restaurant_owner")
        log("info", "User role updated to restaurant_owner", { uid: user.uid })
        toast({
          title: "Role Updated!",
          description: "You are now a restaurant owner. Redirecting to setup.",
          variant: "default",
        })
        router.push("/restaurant-owner/setup")
      } catch (err: any) {
        log("error", "Failed to update user role to restaurant_owner", { error: err.message, uid: user.uid })
        setError("Failed to update role. Please try again.")
        toast({
          title: "Role Update Failed",
          description: "Failed to update role. Please try again.",
          variant: "destructive",
        })
        console.error("Error updating role:", err)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="back" onClick={() => router.back()} className="p-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-4xl font-bold">My Profile</h1>
      </div>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-6 w-6" /> Your Profile
          </CardTitle>
          <CardDescription>Manage your personal information and account settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
            <div className="grid gap-2">
              <Label htmlFor="displayName" className="flex items-center gap-1">
                <User className="h-4 w-4" /> Display Name
              </Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email" className="flex items-center gap-1">
                <Mail className="h-4 w-4" /> Email
              </Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone" className="flex items-center gap-1">
                <Phone className="h-4 w-4" /> Phone Number
              </Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address" className="flex items-center gap-1">
                <MapPin className="h-4 w-4" /> Address
              </Label>
              <Input id="address" type="text" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label className="flex items-center gap-1">
                <Utensils className="h-4 w-4" /> Role
              </Label>
              <Input id="role" type="text" value={role || "user"} readOnly disabled className="bg-gray-100" />
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Profile"}
            </Button>
            {role === "user" && (
              <Button
                type="button"
                variant="outline"
                className="w-full bg-green-600 text-white hover:bg-green-700"
                onClick={handleBecomeRestaurantOwner}
                disabled={isSubmitting}
              >
                Become a Restaurant Owner
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
