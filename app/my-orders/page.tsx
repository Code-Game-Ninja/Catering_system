// app/my-orders/page.tsx
"use client"

import { useState, useEffect } from "react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import type { Order } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { onAuthStateChanged } from "firebase/auth"
import { useRouter } from "next/navigation"
import { log } from "@/lib/logging"
import Image from "next/image"
import { LoadingSpinner } from "@/components/ui/loading-spinner" // Import LoadingSpinner

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        fetchOrders(currentUser.uid)
      } else {
        log("info", "No user logged in, redirecting to login for my orders page")
        router.push("/login")
      }
    })

    return () => unsubscribeAuth()
  }, [router])

  const fetchOrders = async (userId: string) => {
    try {
      const ordersCollection = collection(db, "orders")
      const q = query(ordersCollection, where("userId", "==", userId))
      const querySnapshot = await getDocs(q)
      const ordersList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        orderDate: doc.data().orderDate?.toDate(), // Convert Firebase Timestamp to Date
      })) as Order[]
      // Sort newest → oldest locally
      ordersList.sort((a, b) => (b.orderDate?.getTime() ?? 0) - (a.orderDate?.getTime() ?? 0))
      setOrders(ordersList)
      log("info", "Orders fetched successfully for user", { userId, count: ordersList.length })
    } catch (err: any) {
      log("error", "Failed to fetch orders", { userId, error: err.message })
      setError("Failed to load your orders. Please try again later.")
      console.error("Error fetching orders:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return null // Should redirect to login, but handle this state for safety
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
      <h1 className="text-4xl font-bold text-center mb-10">My Orders</h1>

      {orders.length === 0 ? (
        <p className="text-center text-lg text-gray-600">You haven't placed any orders yet.</p>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Order #{order.id.substring(0, 8)}</CardTitle>
                  <p className="text-sm text-gray-500">
                    Placed on: {order.orderDate.toLocaleDateString()} at {order.orderDate.toLocaleTimeString()}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    order.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : order.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center border rounded-md p-2">
                      <Image
                        src={item.imageUrl || "/placeholder.svg?height=60&width=60"}
                        alt={item.name}
                        width={60}
                        height={60}
                        className="w-16 h-16 object-cover rounded-md mr-3"
                      />
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">
                          ${item.price.toFixed(2)} x {item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-right text-lg font-bold mt-4">Total: ${order.totalAmount.toFixed(2)}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
