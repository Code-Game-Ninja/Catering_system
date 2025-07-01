"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, setDoc } from "firebase/firestore"
import { ref, getDownloadURL, uploadBytesResumable } from "firebase/storage"
import { db, storage, auth } from "@/lib/firebase"
import type { Product, Restaurant } from "@/lib/types"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Edit, Package, UtensilsCrossed, Leaf, Vegan, Info } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast" // Import useToast

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({
    name: "",
    description: "",
    price: 0,
    imageUrl: "",
    category: "",
    restaurantId: "",
    restaurantName: "",
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
  const [userRole, setUserRole] = useState<"user" | "admin" | null>(null)
  const router = useRouter()
  const { toast } = useToast() // Initialize toast

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
          log("info", "User profile auto-created during admin check", { uid: user.uid })
        }

        const userData = (await getDoc(userDocRef)).data()
        if (userData?.role === "admin") {
          setUserRole("admin")
          fetchProducts()
          fetchRestaurants()
        } else {
          log("warn", "Unauthorized access attempt to admin page", { uid: user.uid })
          toast({
            title: "⛔ Access Denied",
            description: "Not authorized to view this page.",
            variant: "destructive",
          })
          router.push("/")
        }
      } else {
        log("info", "No user logged in, redirecting to login for admin page")
        router.push("/login")
      }
    })
    return () => unsubscribe()
  }, [router, toast])

  const fetchProducts = async () => {
    try {
      const productsCollection = collection(db, "products")
      const productSnapshot = await getDocs(productsCollection)
      const productsList = productSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Product[]
      setProducts(productsList)
      log("info", "Admin fetched products successfully", { count: productsList.length })
    } catch (err: any) {
      log("error", "Admin failed to fetch products", { error: err.message })
      setError("Failed to load products. Please try again later.")
      toast({
        title: "❌ Error",
        description: "Could not load products.",
        variant: "destructive",
      })
      console.error("Error fetching products:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchRestaurants = async () => {
    try {
      const restaurantsCollection = collection(db, "restaurants")
      const restaurantSnapshot = await getDocs(restaurantsCollection)
      const restaurantsList = restaurantSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Restaurant[]
      setRestaurants(restaurantsList)
      log("info", "Admin fetched restaurants for product assignment", { count: restaurantsList.length })
    } catch (err: any) {
      log("error", "Admin failed to fetch restaurants for product assignment", { error: err.message })
      setError("Failed to load restaurants for product assignment.")
      toast({
        title: "❌ Error",
        description: "Could not load restaurants.",
        variant: "destructive",
      })
      console.error("Error fetching restaurants:", err)
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

  const handleRestaurantSelect = (restaurantId: string) => {
    const selectedRestaurant = restaurants.find((r) => r.id === restaurantId)
    setCurrentProduct((prev) => ({
      ...prev,
      restaurantId: restaurantId,
      restaurantName: selectedRestaurant ? selectedRestaurant.name : "",
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
      toast({
        title: "🖼️ Image Error",
        description: "Could not process image.",
        variant: "destructive",
      })
      return null
    }

    if (blob.size > 4 * 1024 * 1024) {
      setError("Image is still too large after compression (max 4 MB).")
      toast({
        title: "📦 Too Large",
        description: "Image still too large (max 4 MB).",
        variant: "destructive",
      })
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
      setError("Failed to upload image. Please try again with a smaller file.")
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

    if (
      !currentProduct.name ||
      !currentProduct.description ||
      !currentProduct.price ||
      !currentProduct.category ||
      !currentProduct.restaurantId
    ) {
      setError("Please fill in all required fields, including selecting a restaurant.")
      toast({
        title: "⚠️ Missing Info",
        description: "Fill all required fields.",
        variant: "destructive",
      })
      return
    }

    const imageUrl = await handleUploadImage()
    if (imageFile && !imageUrl) {
      return // Stop if image upload failed (error already toasted)
    }

    const productData = {
      ...currentProduct,
      imageUrl: imageUrl || currentProduct.imageUrl || "/placeholder.svg?height=300&width=400",
      updatedAt: serverTimestamp(),
    } as Product

    try {
      if (isEditing && currentProduct.id) {
        const productRef = doc(db, "products", currentProduct.id)
        await updateDoc(productRef, productData)
        log("info", "Product updated successfully by admin", { productId: currentProduct.id })
        toast({
          title: "✅ Updated!",
          description: "Product details saved.",
          variant: "default",
        })
      } else {
        await addDoc(collection(db, "products"), {
          ...productData,
          createdAt: serverTimestamp(),
        })
        log("info", "Product added successfully by admin", { productName: currentProduct.name })
        toast({
          title: "🍽️ Added!",
          description: "Product added to menu.",
          variant: "default",
        })
      }
      resetForm()
      fetchProducts() // Refresh the list
    } catch (err: any) {
      log("error", "Product save failed by admin", { error: err.message, productData })
      setError("Failed to save product. Please try again.")
      toast({
        title: "❌ Save Failed",
        description: "Could not save product.",
        variant: "destructive",
      })
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
    log("info", "Admin editing product", { productId: product.id })
  }

  const handleDelete = async (productId: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteDoc(doc(db, "products", productId))
        setProducts(products.filter((p) => p.id !== productId))
        log("info", "Product deleted successfully by admin", { productId })
        toast({
          title: "Product Deleted!",
          description: "The product has been removed from the menu.",
          variant: "default",
        })
      } catch (err: any) {
        log("error", "Product deletion failed by admin", { productId, error: err.message })
        setError("Failed to delete product.")
        toast({
          title: "Deletion Failed",
          description: "Failed to delete product. Please try again.",
          variant: "destructive",
        })
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
      restaurantId: "",
      restaurantName: "",
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

  if (userRole === "user") {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
        <p className="text-red-500">Access Denied. You are not authorized to view this page.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold">Product Upload & Management</h1>
          <p className="text-gray-600 mt-2">Upload new products and manage existing ones across all restaurants</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={resetForm} className="bg-green-600 hover:bg-green-700">
            <Plus className="mr-2 h-4 w-4" />
            Upload New Product
          </Button>
        </div>
      </div>

      <div className="mb-10 p-6 border rounded-lg shadow-md bg-card">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          {isEditing ? <Edit className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
          {isEditing ? "Edit Product" : "Upload New Product"}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="grid gap-2">
            <Label htmlFor="restaurantId">Assign to Restaurant</Label>
            <Select value={currentProduct.restaurantId || ""} onValueChange={handleRestaurantSelect} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a restaurant" />
              </SelectTrigger>
              <SelectContent>
                {restaurants.map((restaurant) => (
                  <SelectItem key={restaurant.id} value={restaurant.id}>
                    {restaurant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
            <Input
              id="category"
              name="category"
              type="text"
              placeholder="e.g., Main Course, Appetizer, Dessert"
              value={currentProduct.category || ""}
              onChange={handleInputChange}
              required
            />
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
        <Package className="h-7 w-7" /> All Products
      </h2>
      {products.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <UtensilsCrossed className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-600">No products added yet.</p>
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
