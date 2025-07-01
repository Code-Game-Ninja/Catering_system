"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Restaurant } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { log } from "@/lib/logging"

interface EditRestaurantModalProps {
  isOpen: boolean
  onClose: () => void
  restaurant: Restaurant
  onSave: (updatedRestaurant: Restaurant) => void
}

export function EditRestaurantModal({ isOpen, onClose, restaurant, onSave }: EditRestaurantModalProps) {
  const [name, setName] = useState(restaurant.name)
  const [description, setDescription] = useState(restaurant.description)
  const [address, setAddress] = useState(restaurant.address)
  const [phone, setPhone] = useState(restaurant.phone)
  const [email, setEmail] = useState(restaurant.email)
  const [cuisine, setCuisine] = useState(restaurant.cuisine.join(", "))
  const [imageUrl, setImageUrl] = useState(restaurant.imageUrl)
  const [isActive, setIsActive] = useState(restaurant.isActive)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (restaurant) {
      setName(restaurant.name)
      setDescription(restaurant.description)
      setAddress(restaurant.address)
      setPhone(restaurant.phone)
      setEmail(restaurant.email)
      setCuisine(restaurant.cuisine.join(", "))
      setImageUrl(restaurant.imageUrl)
      setIsActive(restaurant.isActive)
      setError(null)
    }
  }, [restaurant])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const updatedData = {
        name,
        description,
        address,
        phone,
        email,
        cuisine: cuisine
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
        imageUrl,
        isActive,
        updatedAt: new Date(),
      }

      const restaurantRef = doc(db, "restaurants", restaurant.id)
      await updateDoc(restaurantRef, updatedData)

      const updatedRestaurant: Restaurant = {
        ...restaurant,
        ...updatedData,
      }
      onSave(updatedRestaurant)
      log("info", "Restaurant updated successfully", { restaurantId: restaurant.id, updatedData })
      setError(null)
    } catch (err: any) {
      log("error", "Failed to update restaurant", { restaurantId: restaurant.id, error: err.message })
      setError("Could not update. Try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl p-6 z-[9999]">
        <DialogHeader>
          <DialogTitle>Edit Restaurant: {restaurant.name}</DialogTitle>
          <DialogDescription>
            Make changes to the restaurant details here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
            <Label htmlFor="name" className="sm:text-right text-left">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-full sm:col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
            <Label htmlFor="description" className="sm:text-right text-left">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-full sm:col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
            <Label htmlFor="address" className="sm:text-right text-left">
              Address
            </Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="col-span-full sm:col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
            <Label htmlFor="phone" className="sm:text-right text-left">
              Phone
            </Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="col-span-full sm:col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
            <Label htmlFor="email" className="sm:text-right text-left">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="col-span-full sm:col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
            <Label htmlFor="cuisine" className="sm:text-right text-left">
              Cuisine (comma-separated)
            </Label>
            <Input
              id="cuisine"
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
              className="col-span-full sm:col-span-3"
              placeholder="e.g., Indian, Chinese, Italian"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
            <Label htmlFor="imageUrl" className="sm:text-right text-left">
              Image URL
            </Label>
            <Input
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="col-span-full sm:col-span-3"
              placeholder="https://example.com/image.jpg"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
            <Label htmlFor="isActive" className="sm:text-right text-left">
              Active
            </Label>
            <div className="col-span-full sm:col-span-3 flex sm:justify-start justify-start">
              <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm text-center col-span-4">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? <LoadingSpinner /> : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
