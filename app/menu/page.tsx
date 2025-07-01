"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Product } from "@/lib/types"
import { ProductCard } from "@/components/ui/product-card"
import { Input } from "@/components/ui/input"
import { log } from "@/lib/logging"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Search, ArrowLeft } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function MenuPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        const productsCollection = collection(db, "products")
        const q = query(productsCollection, where("isAvailable", "==", true))
        const productSnapshot = await getDocs(q)
        const productsList = productSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        })) as Product[]
        setProducts(productsList)
        setFilteredProducts(productsList) // Initialize filtered products
        log("info", "Menu data fetched successfully", { count: productsList.length })
      } catch (err: any) {
        log("error", "Error fetching menu data", { error: err.message })
        setError(`Error fetching menu data: ${err.message}`)
        console.error("Error fetching menu data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchMenuData()
  }, [])

  useEffect(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase()
    const results = products.filter(
      (product) =>
        product.name.toLowerCase().includes(lowercasedSearchTerm) ||
        product.description.toLowerCase().includes(lowercasedSearchTerm) ||
        product.category.toLowerCase().includes(lowercasedSearchTerm) ||
        product.restaurantName?.toLowerCase().includes(lowercasedSearchTerm),
    )
    setFilteredProducts(results)
  }, [searchTerm, products])

  const handleAddToCart = (product: Product) => {
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
      log("info", "Product added to cart from menu page", { productId: product.id })
      toast({
        title: "🛒 Added to Cart!",
        description: "Item added.",
        variant: "default",
      })
    } catch (e: any) {
      log("error", "Failed to add product to cart (localStorage error)", { productId: product.id, error: e.message })
      toast({
        title: "Add to Cart Failed",
        description: "Failed to add product to cart. Please try again or clear your browser's local storage.",
        variant: "destructive",
      })
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => router.back()} className="p-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-4xl font-bold">Menu</h1>
      </div>

      <div className="mb-8 flex justify-center">
        <div className="relative w-full max-w-md">
          <Input
            type="text"
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        </div>
      </div>

      {filteredProducts.length === 0 && (
        <p className="text-center text-gray-600 text-lg">No products found matching your search.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
        ))}
      </div>

      <section className="my-12">
        <h2 className="text-2xl font-bold mb-4">Sweets</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.filter(p => p.category === 'Sweets').map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  )
}
