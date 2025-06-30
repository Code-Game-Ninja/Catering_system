// app/admin/page.tsx
"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, orderBy, doc, getDoc, setDoc } from "firebase/firestore"
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
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
            createdAt: new Date(),
          })
          log("info", "User profile auto-created during admin dashboard check", { uid: user.uid })
        }

        const userData = (await getDoc(userDocRef)).data()
        if (userData?.role === "admin") {
          setUserRole("admin")
          fetchDashboardStats()
        } else {
          log("warn", "Unauthorized access attempt to admin dashboard", { uid: user.uid })
          router.push("/")
        }
      } else {
        log("info", "No user logged in, redirecting to login for admin dashboard")
        router.push("/login")
      }
    })

    // Add polling for auto-refresh
    const interval = setInterval(() => {
      if (userRole === "admin") fetchDashboardStats()
    }, 30000) // 30 seconds

    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [router, userRole])

  const fetchDashboardStats = async () => {
    try {
      // Fetch orders
      const ordersCollection = collection(db, "orders")
      const ordersQuery = query(ordersCollection, orderBy("orderDate", "desc"))
      const ordersSnapshot = await getDocs(ordersQuery)

      const orders = ordersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        orderDate: doc.data().orderDate?.toDate(),
        estimatedDeliveryTime: doc.data().estimatedDeliveryTime?.toDate(),
      })) as Order[]

      // Fetch products
      const productsCollection = collection(db, "products")
      const productsSnapshot = await getDocs(productsCollection)
      const products = productsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Product[]

      // Fetch restaurants
      const restaurantsCollection = collection(db, "restaurants")
      const restaurantsSnapshot = await getDocs(restaurantsCollection)
      const restaurants = restaurantsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Restaurant[]

      // Fetch users
      const usersCollection = collection(db, "users")
      const usersSnapshot = await getDocs(usersCollection)
      const users = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as UserProfile[]

      // Calculate stats
      const totalOrders = orders.length
      const pendingOrders = orders.filter((order) => order.status === "pending").length
      const completedOrders = orders.filter((order) => order.status === "delivered").length
      const cancelledOrders = orders.filter((order) => order.status === "cancelled").length
      const totalRevenue = orders
        .filter((order) => order.status === "delivered")
        .reduce((sum, order) => sum + order.totalAmount, 0)
      const totalProducts = products.length
      const totalRestaurants = restaurants.length
      const totalUsers = users.filter((user) => user.role === "user").length
      const recentOrders = orders.slice(0, 5)

      // Get top restaurants by rating
      const topRestaurants = restaurants
        .filter((restaurant) => restaurant.isActive)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 5)

      // Get top products by rating
      const topProducts = products
        .filter((product) => product.isAvailable)
        .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
        .slice(0, 5)

      const dashboardStats: DashboardStats = {
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

      setStats(dashboardStats)
      log("info", "Admin dashboard stats fetched successfully")
    } catch (err: any) {
      log("error", "Failed to fetch admin dashboard stats", { error: err.message })
      setError("Failed to load dashboard data. Please try again later.")
      console.error("Error fetching dashboard stats:", err)
    } finally {
      setLoading(false)
    }
  }

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
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-4xl font-bold">Platform Admin Dashboard</h1>
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
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
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
      <Card className="mb-8">
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
                      <p className="text-xs text-gray-500">{order.orderDate.toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${order.totalAmount.toFixed(2)}</p>
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
                  <div key={restaurant.id} className="flex items-center justify-between p-3 border rounded-lg">
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
    </div>
  )
}
