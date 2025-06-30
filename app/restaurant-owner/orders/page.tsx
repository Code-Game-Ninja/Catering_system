"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, doc, updateDoc, query, where, setDoc, getDoc, onSnapshot } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { useRouter } from "next/navigation"
import type { Order, UserProfile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { log } from "@/lib/logging"
import Image from "next/image"
import {
  Search,
  Filter,
  Eye,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  DollarSign,
  User,
  Truck,
} from "lucide-react"

interface OrderWithUserInfo extends Order {
  userEmail?: string
  userName?: string
  userPhone?: string
}

export default function RestaurantOwnerOrdersPage() {
  const [orders, setOrders] = useState<OrderWithUserInfo[]>([])
  const [filteredOrders, setFilteredOrders] = useState<OrderWithUserInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<"user" | "admin" | "restaurant_owner" | null>(null)
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [selectedOrder, setSelectedOrder] = useState<OrderWithUserInfo | null>(null)
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
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
          })
          log("info", "User profile auto-created during restaurant owner orders check", { uid: user.uid })
        }

        const userData = (await getDoc(userDocRef)).data() as UserProfile
        if (userData?.role === "restaurant_owner" && userData.restaurantId) {
          setUserRole("restaurant_owner")
          setRestaurantId(userData.restaurantId)
          fetchOrders(userData.restaurantId)
        } else {
          log("warn", "Unauthorized access attempt to restaurant owner orders page", {
            uid: user.uid,
            role: userData?.role,
          })
          router.push("/")
        }
      } else {
        log("info", "No user logged in, redirecting to login for restaurant owner orders page")
        router.push("/login")
      }
    })
    return () => unsubscribe()
  }, [router])

  const fetchOrders = async (currentRestaurantId: string) => {
    console.log("Querying orders for restaurantId:", currentRestaurantId)
    try {
      const ordersCollection = collection(db, "orders")
      const q = query(ordersCollection, where("restaurantId", "==", currentRestaurantId))
      const unsubscribe = onSnapshot(q, async (querySnapshot) => {
        const ordersList = await Promise.all(
          querySnapshot.docs.map(async (orderDoc) => {
            const orderData = {
              id: orderDoc.id,
              ...orderDoc.data(),
              orderDate: orderDoc.data().orderDate?.toDate(),
            } as Order

            // Fetch user information for each order
            try {
              const userDocRef = doc(db, "users", orderData.userId)
              const userDocSnap = await getDoc(userDocRef)
              if (userDocSnap.exists()) {
                const userData = userDocSnap.data() as UserProfile
                return {
                  ...orderData,
                  userEmail: userData.email,
                  userName: userData.name,
                  userPhone: userData.phone,
                } as OrderWithUserInfo
              }
            } catch (err) {
              log("warn", "Failed to fetch user info for order", { orderId: orderData.id, userId: orderData.userId })
            }

            return orderData as OrderWithUserInfo
          }),
        )

        const sorted = ordersList.sort((a, b) => (b.orderDate?.getTime?.() ?? 0) - (a.orderDate?.getTime?.() ?? 0))
        setOrders(sorted)
        setFilteredOrders(sorted)
        log("info", "Restaurant owner fetched orders successfully", {
          count: ordersList.length,
          restaurantId: currentRestaurantId,
        })
      })

      return () => unsubscribe()
    } catch (err: any) {
      log("error", "Restaurant owner failed to fetch orders", { error: err.message, restaurantId: currentRestaurantId })
      setError("Failed to load orders. Please try again later.")
      console.error("Error fetching orders:", err)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (
    orderId: string,
    newStatus: "pending" | "processing" | "completed" | "cancelled" | "delivered",
  ) => {
    setUpdatingOrderId(orderId)
    try {
      const orderRef = doc(db, "orders", orderId)
      await updateDoc(orderRef, { status: newStatus })

      // Update local state
      const updatedOrders = orders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order))
      setOrders(updatedOrders)
      applyFilters(updatedOrders, searchTerm, statusFilter, dateFilter)

      log("info", "Order status updated successfully by restaurant owner", { orderId, newStatus, restaurantId })
    } catch (err: any) {
      log("error", "Failed to update order status by restaurant owner", {
        orderId,
        newStatus,
        error: err.message,
        restaurantId,
      })
      setError("Failed to update order status. Please try again.")
      console.error("Error updating order status:", err)
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const applyFilters = (ordersList: OrderWithUserInfo[], search: string, status: string, date: string) => {
    let filtered = [...ordersList]

    // Search filter
    if (search.trim()) {
      filtered = filtered.filter(
        (order) =>
          order.id.toLowerCase().includes(search.toLowerCase()) ||
          order.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
          order.userName?.toLowerCase().includes(search.toLowerCase()) ||
          order.items.some((item) => item.name.toLowerCase().includes(search.toLowerCase())),
      )
    }

    // Status filter
    if (status !== "all") {
      filtered = filtered.filter((order) => order.status === status)
    }

    // Date filter
    if (date !== "all") {
      const now = new Date()
      const filterDate = new Date()

      switch (date) {
        case "today":
          filterDate.setHours(0, 0, 0, 0)
          filtered = filtered.filter((order) => order.orderDate >= filterDate)
          break
        case "week":
          filterDate.setDate(now.getDate() - 7)
          filtered = filtered.filter((order) => order.orderDate >= filterDate)
          break
        case "month":
          filterDate.setMonth(now.getMonth() - 1)
          filtered = filtered.filter((order) => order.orderDate >= filterDate)
          break
      }
    }

    setFilteredOrders(filtered)
  }

  useEffect(() => {
    applyFilters(orders, searchTerm, statusFilter, dateFilter)
  }, [searchTerm, statusFilter, dateFilter, orders])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "processing":
        return <Package className="h-4 w-4" />
      case "delivered":
        return <Truck className="h-4 w-4" />
      case "completed": // Assuming completed is a final state, maybe for historical orders
        return <CheckCircle className="h-4 w-4" />
      case "cancelled":
        return <XCircle className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200"
      case "completed":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (loading || userRole === null || restaurantId === null) {
    return <LoadingSpinner />
  }

  if (userRole !== "restaurant_owner" || !restaurantId) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
        <p className="text-red-500">
          Access Denied. You are not authorized to view this page or your restaurant is not set up.
        </p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">My Restaurant Orders</h1>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Package className="h-4 w-4" />
          <span>{filteredOrders.length} orders</span>
        </div>
      </div>

      {/* Filters Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Orders</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Order ID, customer, or item..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date Range</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Actions</Label>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("all")
                  setDateFilter("all")
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-600">
              {orders.length === 0 ? "No orders found for your restaurant." : "No orders match your current filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <CardTitle className="text-lg">Order #{order.id.substring(0, 8)}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {(() => {
                            let dateObj = order.orderDate
                            if (dateObj && typeof dateObj === 'object' && typeof dateObj.toDate === 'function') {
                              dateObj = dateObj.toDate()
                            }
                            if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
                              return `${dateObj.toLocaleDateString()} at ${dateObj.toLocaleTimeString()}`
                            }
                            return 'N/A'
                          })()}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {order.userEmail}
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />${order.totalAmount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge className={`${getStatusColor(order.status)} flex items-center gap-1`}>
                      {getStatusIcon(order.status)}
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {selectedOrder?.id === order.id ? "Hide" : "View"} Details
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {selectedOrder?.id === order.id && (
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Customer Information */}
                    <div>
                      <h3 className="font-semibold mb-3">Customer Information</h3>
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="font-medium">Email:</span> {order.userEmail || "N/A"}
                        </p>
                        <p>
                          <span className="font-medium">Name:</span> {order.userName || "N/A"}
                        </p>
                        <p>
                          <span className="font-medium">Phone:</span> {order.userPhone || "N/A"}
                        </p>
                        <p>
                          <span className="font-medium">User ID:</span> {order.userId}
                        </p>
                        <p>
                          <span className="font-medium">Delivery Address:</span> {order.deliveryAddress || "N/A"}
                        </p>
                        <p>
                          <span className="font-medium">Contact Phone:</span> {order.contactPhone || "N/A"}
                        </p>
                        {order.notes && (
                          <p>
                            <span className="font-medium">Notes:</span> {order.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Order Status Management */}
                    <div>
                      <h3 className="font-semibold mb-3">Update Order Status</h3>
                      <div className="flex items-center gap-2">
                        <Select
                          value={order.status}
                          onValueChange={(
                            newStatus: "pending" | "processing" | "completed" | "cancelled" | "delivered",
                          ) => updateOrderStatus(order.id, newStatus)}
                          disabled={updatingOrderId === order.id}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        {updatingOrderId === order.id && <div className="text-sm text-gray-500">Updating...</div>}
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="mt-6">
                    <h3 className="font-semibold mb-3">Order Items ({order.items.length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                          <Image
                            src={item.imageUrl || "/placeholder.svg?height=60&width=60"}
                            alt={item.name}
                            width={60}
                            height={60}
                            className="w-15 h-15 object-cover rounded-md"
                          />
                          <div className="flex-grow">
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-600">
                              ${item.price.toFixed(2)} × {item.quantity} = ${(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
