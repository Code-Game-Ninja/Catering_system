"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { collection, doc, getDoc, setDoc, serverTimestamp, addDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { log } from "@/lib/logging"
import { ShoppingCart, XCircle, MapPin, Phone, Mail, ArrowLeft } from "lucide-react"
import { useToast } from "@/components/ui/use-toast" // Import useToast

interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  imageUrl: string
  restaurantId: string
  restaurantName: string
}

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [notes, setNotes] = useState("")
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

        if (!userDocSnap.exists()) {
          await setDoc(userDocRef, {
            uid: currentUser.uid,
            email: currentUser.email ?? "",
            role: "user",
            isVerified: false,
            createdAt: serverTimestamp(),
          })
          log("info", "User profile auto-created during cart page check", { uid: currentUser.uid })
        } else {
          const userData = userDocSnap.data()
          setDeliveryAddress(userData?.address || "")
          setContactPhone(userData?.phone || "")
          setContactEmail(userData?.email || currentUser.email || "")
        }
        setLoading(false)
      } else {
        log("info", "No user logged in, redirecting to login for cart page")
        router.push("/login")
      }
    })
    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    const storedCart = localStorage.getItem("cart")
    if (storedCart) {
      setCart(JSON.parse(storedCart))
    }
  }, [])

  const updateLocalStorageCart = (updatedCart: CartItem[]) => {
    localStorage.setItem("cart", JSON.stringify(updatedCart))
    setCart(updatedCart)
  }

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId)
      return
    }
    const updatedCart = cart.map((item) => (item.productId === productId ? { ...item, quantity: newQuantity } : item))
    updateLocalStorageCart(updatedCart)
  }

  const handleRemoveItem = (productId: string) => {
    const updatedCart = cart.filter((item) => item.productId !== productId)
    updateLocalStorageCart(updatedCart)
    toast({
      title: "Item Removed",
      description: "Product removed from your cart.",
      variant: "default",
    })
  }

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2)
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    if (!user) {
      setError("You must be logged in to place an order.")
      toast({
        title: "Authentication Required",
        description: "You must be logged in to place an order.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    if (cart.length === 0) {
      setError("Your cart is empty.")
      toast({
        title: "Cart Empty",
        description: "Your cart is empty. Please add items before placing an order.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    if (!deliveryAddress || !contactPhone || !contactEmail) {
      setError("Please fill in all delivery and contact details.")
      toast({
        title: "Missing Details",
        description: "Please fill in all delivery and contact details.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    try {
      // Determine restaurantId and restaurantName for the order (if all items are from the same restaurant)
      let restaurantId = null;
      let restaurantName = null;
      if (cart.length > 0) {
        const firstRestaurantId = cart[0].restaurantId;
        const allSameRestaurant = cart.every(item => item.restaurantId === firstRestaurantId);
        if (allSameRestaurant) {
          restaurantId = firstRestaurantId;
          restaurantName = cart[0].restaurantName;
        }
      }
      const orderData = {
        userId: user.uid,
        items: cart.map((item) => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          imageUrl: item.imageUrl,
          restaurantId: item.restaurantId,
          restaurantName: item.restaurantName,
        })),
        totalAmount: Number.parseFloat(calculateTotal()),
        deliveryAddress,
        contactPhone,
        contactEmail,
        notes,
        status: "pending", // pending, confirmed, preparing, out_for_delivery, delivered, cancelled
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...(restaurantId && { restaurantId }),
        ...(restaurantName && { restaurantName }),
      }

      const orderRef = await addDoc(collection(db, "orders"), orderData)
      log("info", "Order placed successfully", { orderId: orderRef.id, userId: user.uid })

      // Clear cart after successful order
      updateLocalStorageCart([])
      toast({
        title: "Order Placed!",
        description: `Your order #${orderRef.id.substring(0, 8)} has been placed successfully. Please select a payment method.`,
        variant: "default",
      })
      router.push(`/payment?orderId=${orderRef.id}`)
    } catch (err: any) {
      log("error", "Failed to place order", { error: err.message, userId: user.uid })
      setError("Failed to place order. Please try again.")
      toast({
        title: "Order Failed",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      })
      console.error("Error placing order:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => router.back()} className="p-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-4xl font-bold">Cart</h1>
      </div>

      {cart.length === 0 ? (
        <Card className="max-w-2xl mx-auto text-center py-12">
          <CardContent>
            <XCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600 font-semibold">Your cart is empty.</p>
            <p className="text-gray-500 mt-2">Add some delicious items to get started!</p>
            <Button onClick={() => router.push("/menu")} className="mt-6">
              Browse Menu
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>Review your selected items before placing the order.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.productId}
                      className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b pb-4 last:border-b-0"
                    >
                      <img
                        src={item.imageUrl || "/placeholder.svg?height=80&width=80"}
                        alt={item.name}
                        width={80}
                        height={80}
                        className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-md mr-4"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-sm text-gray-500">{item.restaurantName}</p>
                        <p className="text-sm font-medium">₹{item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap justify-end sm:justify-start">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                        >
                          -
                        </Button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.productId, Number.parseInt(e.target.value))}
                          className="w-12 text-center mx-2 sm:w-16"
                          min="1"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                        >
                          +
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.productId)}>
                          <XCircle className="h-5 w-5 text-red-500" />
                          <span className="sr-only">Remove item</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex justify-between items-center font-bold text-lg">
                  <span>Total:</span>
                  <span>₹{calculateTotal()}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Delivery & Contact Information</CardTitle>
                <CardDescription>Please provide your details for order delivery.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitOrder} className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="deliveryAddress" className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" /> Delivery Address
                    </Label>
                    <Input
                      id="deliveryAddress"
                      type="text"
                      placeholder="123 Main St, City, State, Zip"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="contactPhone" className="flex items-center gap-1">
                      <Phone className="h-4 w-4" /> Phone Number
                    </Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      placeholder="123-456-7890"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="contactEmail" className="flex items-center gap-1">
                      <Mail className="h-4 w-4" /> Email Address
                    </Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="your.email@example.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Special Instructions / Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="e.g., no nuts, deliver to back door"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                  {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Placing Order..." : "Place Order"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
