// app/admin/page.tsx
"use client"

import { useState, useEffect, useMemo } from "react"
import { collection, getDocs, query, orderBy, doc, getDoc, setDoc, onSnapshot } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { useRouter } from "next/navigation"
import type { Order, Product, Restaurant, UserProfile } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { log } from "@/lib/logging"
import Link from "next/link"
import { Package, ShoppingCart, DollarSign, Clock, CheckCircle, Star, BarChart3, Store, Users, ArrowLeft } from "lucide-react"

interface DashboardStats {
  totalOrders: number
  pendingOrders: number
  completedOrders: number
  cancelledOrders: number
  totalRevenue: number
  totalProducts: number
  totalRestaurants: number
  totalUsers: number
  recentOrders: Order[]
  topRestaurants: Restaurant[]
  topProducts: Product[]
}

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<"user" | "restaurant_owner" | "admin" | null>(null)
  const [invalidOrders, setInvalidOrders] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid)
        const userDocSnap = await getDoc(userDocRef)
        if (!userDocSnap.exists()) {
          await setDoc(userDocRef, {
            uid: user.uid,
            email: user.email ?? "",
            role: "user",
            isVerified: false,
            createdAt: new Date(),
          })
          log("info", "User profile auto-created during admin dashboard check", { uid: user.uid })
        }
        const userData = (await getDoc(userDocRef)).data()
        if (userData?.role === "admin") {
          setUserRole("admin")
        } else {
          log("warn", "Unauthorized access attempt to admin dashboard", { uid: user.uid })
          router.push("/")
        }
      } else {
        log("info", "No user logged in, redirecting to login for admin dashboard")
        router.push("/login")
      }
    })

    // Set up all listeners in parallel
    const unsubOrders = onSnapshot(collection(db, "orders"), (ordersSnapshot) => {
        const validOrders: Order[] = []
        const invalidOrders: any[] = []
        ordersSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          if (
            typeof data.status === 'string' &&
            typeof data.totalAmount === 'number' &&
            (data.orderDate && (typeof data.orderDate.toDate === 'function' || data.orderDate instanceof Date))
          ) {
            validOrders.push({
              id: doc.id,
              userId: data.userId || '',
              userName: data.userName || '',
              userEmail: data.userEmail || '',
              restaurantId: data.restaurantId || '',
              restaurantName: data.restaurantName || '',
              items: data.items || [],
              totalAmount: data.totalAmount,
              status: data.status,
              orderDate: data.orderDate && typeof data.orderDate.toDate === 'function' ? data.orderDate.toDate() : data.orderDate,
              deliveryAddress: data.deliveryAddress || '',
              contactPhone: data.contactPhone || '',
              notes: data.notes || '',
              updatedAt: data.updatedAt || undefined,
              estimatedDeliveryTime: data.estimatedDeliveryTime && typeof data.estimatedDeliveryTime.toDate === 'function' ? data.estimatedDeliveryTime.toDate() : data.estimatedDeliveryTime,
            } as unknown as Order)
          } else {
            invalidOrders.push({ id: doc.id, ...data })
        }
      })
      setOrders(validOrders)
      setInvalidOrders(invalidOrders)
    })
    const unsubProducts = onSnapshot(collection(db, "products"), (productsSnapshot) => {
      setProducts(productsSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt && typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : data.createdAt,
              updatedAt: data.updatedAt && typeof data.updatedAt.toDate === 'function' ? data.updatedAt.toDate() : data.updatedAt,
            } as unknown as Product;
      }))
    })
    const unsubRestaurants = onSnapshot(collection(db, "restaurants"), (restaurantsSnapshot) => {
      setRestaurants(restaurantsSnapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt && typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : data.createdAt,
                updatedAt: data.updatedAt && typeof data.updatedAt.toDate === 'function' ? data.updatedAt.toDate() : data.updatedAt,
              } as unknown as Restaurant;
      }))
    })
    const unsubUsers = onSnapshot(collection(db, "users"), (usersSnapshot) => {
      setUsers(usersSnapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                  id: doc.id,
                  ...data,
                  createdAt: data.createdAt && typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : data.createdAt,
                } as unknown as UserProfile;
      }))
    })

    setLoading(false)
    return () => {
      unsubscribeAuth && unsubscribeAuth()
      unsubOrders && unsubOrders()
      unsubProducts && unsubProducts()
      unsubRestaurants && unsubRestaurants()
      unsubUsers && unsubUsers()
    }
  }, [router])

  // Calculate stats from latest state
  const stats = useMemo(() => {
    if (!orders || !products || !restaurants || !users) return null
    const totalOrders = orders.length
    const pendingOrders = orders.filter((order) => order.status === "pending").length
    const completedOrders = orders.filter((order) => order.status === "delivered" || order.status === "completed").length
    const cancelledOrders = orders.filter((order) => order.status === "cancelled").length
    const platformFeeRate = 0.10
    const totalRevenue = orders
                .filter((order) => order.status === "delivered")
                .reduce((sum, order) => sum + (order.totalAmount * platformFeeRate), 0)
              const totalProducts = products.length
              const totalRestaurants = restaurants.length
              const totalUsers = users.filter((user) => user.role === "user").length
    const recentOrders = [...orders].sort((a, b) => (b.orderDate instanceof Date && a.orderDate instanceof Date ? b.orderDate.getTime() - a.orderDate.getTime() : 0)).slice(0, 5)
    const topRestaurants = [...restaurants]
                .filter((restaurant) => restaurant.isActive)
                .sort((a, b) => (b.rating || 0) - (a.rating || 0))
                .slice(0, 5)
    const topProducts = [...products]
                .filter((product) => product.isAvailable)
                .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
                .slice(0, 5)
    return {
                totalOrders,
                pendingOrders,
                completedOrders,
                cancelledOrders,
                totalRevenue,
                totalProducts,
                totalRestaurants,
                totalUsers,
                recentOrders,
                topRestaurants,
                topProducts,
              }
  }, [orders, products, restaurants, users])

  if (loading || userRole === null) {
    return <LoadingSpinner />
  }

  if (userRole !== "admin") {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
        <p className="text-red-500">Access Denied. You are not authorized to view this page.</p>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
        <p className="text-red-500">{error || "Failed to load dashboard"}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-2">
          <Button variant="back" onClick={() => router.back()} className="p-2 md:hidden">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold">Platform Admin Dashboard</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <BarChart3 className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Main Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Restaurants</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRestaurants}</div>
            <p className="text-xs text-muted-foreground">Active partners</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">All time orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From completed orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalProducts}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mb-8 bg-white rounded-xl shadow-lg">
        <CardHeader>
          <CardTitle>Platform Management</CardTitle>
          <CardDescription>Manage restaurants, users, products, and platform settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/admin/products">
              <Button className="w-full h-20 flex flex-col gap-2">
                <Package className="h-6 w-6" />
                <span>Upload & Manage Products</span>
              </Button>
            </Link>

            <Link href="/admin/restaurants">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <Store className="h-6 w-6" />
                <span>Manage Restaurants</span>
              </Button>
            </Link>

            <Link href="/admin/orders">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <ShoppingCart className="h-6 w-6" />
                <span>Manage Orders</span>
              </Button>
            </Link>

            <Link href="/admin/users">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <Users className="h-6 w-6" />
                <span>Manage Users</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity and Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest orders across all restaurants</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No orders yet</p>
            ) : (
              <div className="space-y-4">
                {stats.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Order #{order.id.substring(0, 8)}</p>
                      <p className="text-sm text-gray-600">{order.restaurantName}</p>
                      <p className="text-xs text-gray-500">{order.orderDate instanceof Date ? order.orderDate.toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{order.totalAmount.toFixed(2)}</p>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          order.status === "delivered"
                            ? "bg-green-100 text-green-800"
                            : order.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
                <Link href="/admin/orders">
                  <Button variant="outline" className="w-full">
                    View All Orders
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Restaurants */}
        <Card>
          <CardHeader>
            <CardTitle>Top Restaurants</CardTitle>
            <CardDescription>Highest rated restaurant partners</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topRestaurants.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No restaurants yet</p>
            ) : (
              <div className="space-y-4">
                {stats.topRestaurants.map((restaurant) => (
                  <div key={restaurant.id} className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50">
                    <div>
                      <p className="font-medium">{restaurant.name}</p>
                      <p className="text-sm text-gray-600">{restaurant.cuisine.join(", ")}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{restaurant.rating?.toFixed(1) || "N/A"}</span>
                      </div>
                      <p className="text-xs text-gray-500">{restaurant.totalReviews || 0} reviews</p>
                    </div>
                  </div>
                ))}
                <Link href="/admin/restaurants">
                  <Button variant="outline" className="w-full">
                    Manage Restaurants
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>Top Menu Items</CardTitle>
          <CardDescription>Highest rated menu products</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.topProducts.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No products yet</p>
          ) : (
            <div className="space-y-4">
              {stats.topProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg bg-blue-50">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-600">₹{product.price.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    {typeof product.averageRating === 'number' && !isNaN(product.averageRating) ? (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{product.averageRating.toFixed(1)}</span>
                      </div>
                    ) : null}
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${product.isAvailable ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                    >
                      {product.isAvailable ? "Available" : "Unavailable"}
                    </span>
                  </div>
                </div>
              ))}
              <Link href="/admin/products">
                <Button variant="outline" className="w-full">
                  Manage Products
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
