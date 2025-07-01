"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  setDoc,
  query,
  where,
} from "firebase/firestore"
import { ref, getDownloadURL, uploadBytesResumable } from "firebase/storage"
import { db, storage, auth } from "@/lib/firebase"
import type { Product } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ProductCard } from "@/components/ui/product-card"
import { log } from "@/lib/logging"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { getDoc } from "firebase/firestore"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { resizeAndCompress } from "@/lib/resize-image"
import { Plus, Edit, Package, UtensilsCrossed, Leaf, Vegan, Info } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"

export default function RestaurantOwnerProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({
    name: "",
    description: "",
    price: 0,
    imageUrl: "",
    category: "",
    isAvailable: true,
    preparationTime: 0,
    ingredients: [],
    allergens: [],
    isVegetarian: false,
    isVegan: false,
    spiceLevel: "mild",
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [userRestaurantId, setUserRestaurantId] = useState<string | null>(null)
  const [userRestaurantName, setUserRestaurantName] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<"user" | "restaurant_owner" | "admin" | null>(null)
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
            createdAt: serverTimestamp(),
          })
        }

        const userData = userDocSnap.data()
        if (userData?.role === "restaurant_owner" && userData.restaurantId) {
          setUserRole("restaurant_owner")
          setUserRestaurantId(userData.restaurantId)
          const restaurantDocSnap = await getDoc(doc(db, "restaurants", userData.restaurantId))
          if (restaurantDocSnap.exists()) {
            setUserRestaurantName(restaurantDocSnap.data().name)
          }
          fetchProducts(userData.restaurantId)
        } else if (userData?.role === "restaurant_owner" && !userData.restaurantId) {
          log("info", "Restaurant owner needs to set up restaurant, redirecting", { uid: user.uid })
          setError("Set up your restaurant first.")
          router.push("/restaurant-owner/setup")
        } else {
          log("warn", "Unauthorized access attempt to restaurant owner products page", {
            uid: user.uid,
            role: userData?.role,
          })
          setError("Not authorized to view this page.")
          router.push("/")
        }
      } else {
        log("info", "No user logged in, redirecting to login for restaurant owner products page")
        router.push("/login")
      }
    })
    return () => unsubscribe()
  }, [router])

  const fetchProducts = async (restaurantId: string) => {
    try {
      const productsCollection = collection(db, "products")
      const q = query(productsCollection, where("restaurantId", "==", restaurantId))
      const productSnapshot = await getDocs(q)
      const productsList = productSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Product[]
      setProducts(productsList)
      log("info", "Restaurant owner fetched products successfully", { restaurantId, count: productsList.length })
    } catch (err: any) {
      log("error", "Restaurant owner failed to fetch products", { error: err.message, restaurantId })
      setError("Could not load products.")
      console.error("Error fetching products:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setCurrentProduct((prev) => ({
      ...prev,
      [name]: name === "price" || name === "preparationTime" ? Number.parseFloat(value) : value,
    }))
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setCurrentProduct((prev) => ({ ...prev, [name]: checked }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setCurrentProduct((prev) => ({ ...prev, [name]: value }))
  }

  const handleArrayInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setCurrentProduct((prev) => ({
      ...prev,
      [name]: value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0])
    }
  }

  const handleUploadImage = async (): Promise<string | null> => {
    if (!imageFile) return currentProduct.imageUrl || null

    let blob: Blob
    try {
      blob = await resizeAndCompress(imageFile, { maxWidth: 1920, quality: 0.8 })
    } catch (err: any) {
      log("error", "Image resize/compression failed", { fileName: imageFile.name, error: err.message })
      setError("Could not process image.")
      return null
    }

    if (blob.size > 4 * 1024 * 1024) {
      setError("Image still too large (max 4 MB).")
      return null
    }

    setUploading(true)
    const storageRef = ref(storage, `product_images/${Date.now()}-${imageFile.name.replace(/\s+/g, "_")}`)
    try {
      const uploadTask = uploadBytesResumable(storageRef, blob)
      uploadTask.on("state_changed", (snap) => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100)
        log("debug", "Upload progress", { fileName: imageFile.name, pct })
      })
      await uploadTask
      const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
      log("info", "Image uploaded successfully", { fileName: imageFile.name, downloadURL })
      return downloadURL
    } catch (err: any) {
      log("error", "Image upload failed", { fileName: imageFile.name, error: err.message })
      setError("Could not upload image.")
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!userRestaurantId || !userRestaurantName) {
      setError("Restaurant information not available. Please set up your restaurant first.")
      return
    }

    if (!currentProduct.name || !currentProduct.description || !currentProduct.price || !currentProduct.category) {
      setError("Fill all required fields.")
      return
    }

    const imageUrl = await handleUploadImage()
    if (imageFile && !imageUrl) {
      return // Stop if image upload failed (error already toasted)
    }

    const productData = {
      ...currentProduct,
      imageUrl: imageUrl || currentProduct.imageUrl || "/placeholder.svg?height=300&width=400",
      restaurantId: userRestaurantId,
      restaurantName: userRestaurantName,
      updatedAt: serverTimestamp(),
      ingredients: Array.isArray(currentProduct.ingredients)
        ? currentProduct.ingredients
        : (typeof currentProduct.ingredients === 'string' ? (currentProduct.ingredients as string).split(',').map((i: string) => i.trim()).filter(Boolean) : []),
      allergens: Array.isArray(currentProduct.allergens)
        ? currentProduct.allergens
        : (typeof currentProduct.allergens === 'string' ? (currentProduct.allergens as string).split(',').map((i: string) => i.trim()).filter(Boolean) : []),
    }

    try {
      if (isEditing && currentProduct.id) {
        const productRef = doc(db, "products", currentProduct.id)
        await updateDoc(productRef, productData)
        log("info", "Product updated successfully by restaurant owner", {
          productId: currentProduct.id,
          restaurantId: userRestaurantId,
        })
        setError(null)
      } else {
        await addDoc(collection(db, "products"), {
          ...productData,
          averageRating: 0,
          totalReviews: 0,
          createdAt: serverTimestamp(),
        })
        log("info", "Product added successfully by restaurant owner", {
          productName: currentProduct.name,
          restaurantId: userRestaurantId,
        })
        setError(null)
      }
      resetForm()
      fetchProducts(userRestaurantId) // Refresh the list
    } catch (err: any) {
      log("error", "Product save failed for restaurant owner", {
        error: err.message,
        productData,
        restaurantId: userRestaurantId,
      })
      setError("Could not save product.")
      console.error("Error saving product:", err)
    }
  }

  const handleEdit = (product: Product) => {
    setIsEditing(true)
    setCurrentProduct({
      ...product,
      ingredients: product.ingredients?.join(", ") || "",
      allergens: product.allergens?.join(", ") || "",
    })
    setImageFile(null)
    log("info", "Restaurant owner editing product", { productId: product.id })
  }

  const handleDelete = async (productId: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteDoc(doc(db, "products", productId))
        setProducts(products.filter((p) => p.id !== productId))
        log("info", "Product deleted successfully by restaurant owner", { productId, restaurantId: userRestaurantId })
      } catch (err: any) {
        log("error", "Product deletion failed for restaurant owner", {
          productId,
          error: err.message,
          restaurantId: userRestaurantId,
        })
        setError("Failed to delete product.")
        console.error("Error deleting product:", err)
      }
    }
  }

  const resetForm = () => {
    setIsEditing(false)
    setCurrentProduct({
      name: "",
      description: "",
      price: 0,
      imageUrl: "",
      category: "",
      isAvailable: true,
      preparationTime: 0,
      ingredients: [],
      allergens: [],
      isVegetarian: false,
      isVegan: false,
      spiceLevel: "mild",
    })
    setImageFile(null)
    setError(null)
  }

  if (loading || userRole === null) {
    return <LoadingSpinner />
  }

  if (userRole !== "restaurant_owner") {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
        <p className="text-red-500">Access Denied. You are not authorized to view this page.</p>
      </div>
    )
  }

  if (!userRestaurantId) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
        <p className="text-red-500">Your restaurant is not set up yet. Please go to the setup page.</p>
        <Button onClick={() => router.push("/restaurant-owner/setup")}>Go to Setup</Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-10">
        {userRestaurantName ? `${userRestaurantName}'s Menu Management` : "Your Menu Management"}
      </h1>

      <div className="mb-10 p-6 border rounded-lg shadow-md bg-card">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          {isEditing ? <Edit className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
          {isEditing ? "Edit Product" : "Add New Product"}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="grid gap-2">
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Delicious Biryani"
              value={currentProduct.name || ""}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              placeholder="15.99"
              value={currentProduct.price || ""}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={currentProduct.category || "Main Course"}
              onValueChange={(value) => handleSelectChange("category", value)}
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Main Course">Main Course</SelectItem>
                <SelectItem value="Appetizer">Appetizer</SelectItem>
                <SelectItem value="Dessert">Dessert</SelectItem>
                <SelectItem value="Sweets">Sweets</SelectItem>
                <SelectItem value="Beverage">Beverage</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="preparationTime">Preparation Time (minutes)</Label>
            <Input
              id="preparationTime"
              name="preparationTime"
              type="number"
              placeholder="30"
              value={currentProduct.preparationTime || ""}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="grid gap-2 col-span-full">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="A detailed description of the catering item..."
              value={currentProduct.description || ""}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="grid gap-2 col-span-full">
            <Label htmlFor="ingredients">Ingredients (comma-separated)</Label>
            <Input
              id="ingredients"
              name="ingredients"
              type="text"
              placeholder="e.g., rice, chicken, spices"
              value={
                Array.isArray(currentProduct.ingredients)
                  ? currentProduct.ingredients.join(", ")
                  : currentProduct.ingredients || ""
              }
              onChange={handleArrayInputChange}
            />
          </div>
          <div className="grid gap-2 col-span-full">
            <Label htmlFor="allergens">Allergens (comma-separated)</Label>
            <Input
              id="allergens"
              name="allergens"
              type="text"
              placeholder="e.g., nuts, dairy, gluten"
              value={
                Array.isArray(currentProduct.allergens)
                  ? currentProduct.allergens.join(", ")
                  : currentProduct.allergens || ""
              }
              onChange={handleArrayInputChange}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 col-span-full">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isAvailable"
                name="isAvailable"
                checked={currentProduct.isAvailable}
                onCheckedChange={(checked) => setCurrentProduct((prev) => ({ ...prev, isAvailable: Boolean(checked) }))}
              />
              <Label htmlFor="isAvailable" className="flex items-center gap-1">
                <Info className="h-4 w-4 text-muted-foreground" /> Available
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isVegetarian"
                name="isVegetarian"
                checked={currentProduct.isVegetarian}
                onCheckedChange={(checked) =>
                  setCurrentProduct((prev) => ({ ...prev, isVegetarian: Boolean(checked) }))
                }
              />
              <Label htmlFor="isVegetarian" className="flex items-center gap-1">
                <Leaf className="h-4 w-4 text-green-600" /> Vegetarian
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isVegan"
                name="isVegan"
                checked={currentProduct.isVegan}
                onCheckedChange={(checked) => setCurrentProduct((prev) => ({ ...prev, isVegan: Boolean(checked) }))}
              />
              <Label htmlFor="isVegan" className="flex items-center gap-1">
                <Vegan className="h-4 w-4 text-green-800" /> Vegan
              </Label>
            </div>
          </div>
          <div className="grid gap-2 col-span-full">
            <Label htmlFor="spiceLevel">Spice Level</Label>
            <Select
              value={currentProduct.spiceLevel || "mild"}
              onValueChange={(value) => handleSelectChange("spiceLevel", value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select spice level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sweet">Sweet</SelectItem>
                <SelectItem value="mild">Mild</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hot">Hot</SelectItem>
                <SelectItem value="very-hot">Very Hot</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2 col-span-full">
            <Label htmlFor="image">Product Image</Label>
            <Input id="image" name="image" type="file" accept="image/*" onChange={handleImageChange} />
            {currentProduct.imageUrl && !imageFile && (
              <p className="text-sm text-gray-500">
                Current image:{" "}
                <a href={currentProduct.imageUrl} target="_blank" rel="noopener noreferrer" className="underline">
                  View
                </a>
              </p>
            )}
          </div>
          {error && <p className="text-red-500 text-sm col-span-full text-center">{error}</p>}
          <div className="col-span-full flex gap-4">
            <Button type="submit" disabled={uploading} className="flex-1">
              {uploading ? "Uploading Image..." : isEditing ? "Update Product" : "Add Product"}
            </Button>
            <Button type="button" variant="outline" className="flex-1 bg-black text-white" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </form>
      </div>

      <h2 className="text-3xl font-bold mb-6 text-center flex items-center justify-center gap-2">
        <Package className="h-7 w-7" /> Your Existing Menu Items
      </h2>
      {products.length === 0 ? (
        <Card className="bg-white rounded-xl shadow-lg">
          <CardContent className="text-center py-12">
            <UtensilsCrossed className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-600">No products added to your menu yet.</p>
            <Button onClick={resetForm} className="mt-4">
              <Plus className="mr-2 h-4 w-4" /> Add Your First Product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isAdmin={true}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
