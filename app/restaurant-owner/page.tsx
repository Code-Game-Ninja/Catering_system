"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, doc, getDoc, setDoc, query, where, onSnapshot, addDoc, Timestamp } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { useRouter } from "next/navigation"
import type { Restaurant, Product, Order } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { log } from "@/lib/logging"
import Link from "next/link"
import { Package, ShoppingCart, DollarSign, Clock, Star, Settings, BarChart3, Store, Plus, Calendar } from "lucide-react"

interface RestaurantStats {
  totalOrders: number
  pendingOrders: number
  completedOrders: number
  totalRevenue: number
  totalProducts: number
  averageRating: number
  totalReviews: number
  recentOrders: Order[]
  topProducts: Product[]
}

export default function RestaurantOwnerDashboard() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [stats, setStats] = useState<RestaurantStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<"user" | "restaurant_owner" | "admin" | null>(null)
  const [unpaidFee, setUnpaidFee] = useState(0)
  const [paying, setPaying] = useState(false)
  const [feePaid, setFeePaid] = useState(false)
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
        }

        const userData = (await getDoc(userDocRef)).data()
        if (userData?.role === "restaurant_owner" && userData.restaurantId) {
          setUserRole("restaurant_owner")
          // Only fetch restaurant data after both role and restaurantId are confirmed
          await fetchRestaurantData(userData.restaurantId)
        } else if (userData?.role === "restaurant_owner" && !userData.restaurantId) {
          // Redirect to setup if no restaurantId
          router.push("/restaurant-owner/setup")
        } else {
          log("warn", "Unauthorized access attempt to restaurant owner dashboard", { uid: user.uid })
          router.push("/")
        }
      } else {
        router.push("/login")
      }
    })
    return () => unsubscribe()
  }, [router])

  const fetchRestaurantData = async (restaurantId: string) => {
    try {
      // Fetch restaurant details in real time
      const restaurantDocRef = doc(db, "restaurants", restaurantId)
      const unsubscribeRestaurant = onSnapshot(restaurantDocRef, (restaurantDocSnap) => {
        if (!restaurantDocSnap.exists()) {
          setError("Restaurant not found")
          return
        }
        const data = restaurantDocSnap.data();
        const restaurantData = {
          id: restaurantDocSnap.id,
          ...data,
          createdAt: data.createdAt && typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt && typeof data.updatedAt.toDate === 'function' ? data.updatedAt.toDate() : data.updatedAt,
        } as unknown as Restaurant;
        setRestaurant(restaurantData)
      }, (err) => {
        setError("Failed to load restaurant data: " + err.message)
      })

      // Fetch orders for this restaurant (already real-time)
      const ordersCollection = collection(db, "orders")
      const ordersQuery = query(ordersCollection, where("restaurantId", "==", restaurantId))
      const unsubscribeOrders = onSnapshot(ordersQuery, async (snapshot) => {
        const orders = snapshot.docs.map((doc) => {
          const data = doc.data();
          if (!data.userId || !data.restaurantId || !data.status || !data.totalAmount) return null;
          return {
            id: doc.id,
            ...data,
            orderDate: data.orderDate && typeof data.orderDate.toDate === 'function' ? data.orderDate.toDate() : data.orderDate,
            estimatedDeliveryTime: data.estimatedDeliveryTime && typeof data.estimatedDeliveryTime.toDate === 'function' ? data.estimatedDeliveryTime.toDate() : data.estimatedDeliveryTime,
          } as unknown as Order;
        }).filter((o): o is Order => o !== null);

        orders.sort((a, b) => {
          const aTime = a && a.orderDate instanceof Date ? a.orderDate.getTime() : 0;
          const bTime = b && b.orderDate instanceof Date ? b.orderDate.getTime() : 0;
          return bTime - aTime;
        });

        // Fetch products for this restaurant in real time
        const productsCollection = collection(db, "products")
        const productsQuery = query(productsCollection, where("restaurantId", "==", restaurantId))
        const unsubscribeProducts = onSnapshot(productsQuery, (productsSnapshot) => {
          const products = productsSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt && typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : data.createdAt,
              updatedAt: data.updatedAt && typeof data.updatedAt.toDate === 'function' ? data.updatedAt.toDate() : data.updatedAt,
            } as unknown as Product;
          });

          const recentOrders = orders.slice(0, 5)
          const topProducts = products
            .filter((product) => product.isAvailable)
            .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
            .slice(0, 5)

          const platformFeeRate = 0.10;
          const restaurantStats: RestaurantStats = {
            totalOrders: orders.length,
            pendingOrders: orders.filter((order) => ["pending", "confirmed", "preparing"].includes(order.status)).length,
            completedOrders: orders.filter((order) => order.status === "delivered").length,
            totalRevenue: orders.filter((order) => order.status === "delivered").reduce((sum, order) => sum + (order.totalAmount * (1 - platformFeeRate)), 0),
            totalProducts: products.length,
            averageRating: restaurant ? restaurant.rating || 0 : 0,
            totalReviews: restaurant ? restaurant.totalReviews || 0 : 0,
            recentOrders,
            topProducts,
          }

          setStats(restaurantStats)
          log("info", "Restaurant owner dashboard data fetched successfully (real-time)", { restaurantId })
        }, (err) => {
          setError("Failed to load products: " + err.message)
        })
      }, (err) => {
        setError("Failed to load orders: " + err.message)
      })

      // Return unsubscribe functions if needed for cleanup
      return () => {
        unsubscribeRestaurant()
        unsubscribeOrders()
        // unsubscribeProducts() is called inside orders snapshot
      }
    } catch (err: any) {
      log("error", "Failed to fetch restaurant owner dashboard data", { error: err.message })
      setError("Failed to load dashboard data. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  // Fetch unpaid platform fee for this restaurant
  useEffect(() => {
    async function fetchUnpaidFee() {
      if (!restaurant) return
      // Get all delivered orders
      const ordersCollection = collection(db, "orders")
      const ordersQuery = query(ordersCollection, where("restaurantId", "==", restaurant.id), where("status", "==", "delivered"))
      const ordersSnapshot = await getDocs(ordersQuery)
      const deliveredOrders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[]
      // Get all paid platform fee records
      const feesCollection = collection(db, "platformFees")
      const feesQuery = query(feesCollection, where("restaurantId", "==", restaurant.id), where("paid", "==", true))
      const feesSnapshot = await getDocs(feesQuery)
      const paidOrderIds = feesSnapshot.docs.flatMap(feeDoc => feeDoc.data().ordersCovered || [])
      // Calculate unpaid orders
      const unpaidOrders = deliveredOrders.filter(order => !paidOrderIds.includes(order.id))
      const platformFeeRate = 0.10
      const unpaidFeeAmount = unpaidOrders.reduce((sum, order) => sum + (order.totalAmount * platformFeeRate), 0)
      setUnpaidFee(unpaidFeeAmount)
    }
    fetchUnpaidFee()
  }, [restaurant])

  // Pay platform fee handler
  const handlePayFee = async () => {
    if (!restaurant || unpaidFee <= 0) return
    setPaying(true)
    try {
      // Get all delivered orders
      const ordersCollection = collection(db, "orders")
      const ordersQuery = query(ordersCollection, where("restaurantId", "==", restaurant.id), where("status", "==", "delivered"))
      const ordersSnapshot = await getDocs(ordersQuery)
      const deliveredOrders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[]
      // Get all paid platform fee records
      const feesCollection = collection(db, "platformFees")
      const feesQuery = query(feesCollection, where("restaurantId", "==", restaurant.id), where("paid", "==", true))
      const feesSnapshot = await getDocs(feesQuery)
      const paidOrderIds = feesSnapshot.docs.flatMap(feeDoc => feeDoc.data().ordersCovered || [])
      // Calculate unpaid orders
      const unpaidOrders = deliveredOrders.filter(order => !paidOrderIds.includes(order.id))
      // Create a new platform fee record
      await addDoc(collection(db, "platformFees"), {
        restaurantId: restaurant.id,
        amount: unpaidFee,
        paid: true,
        paidAt: Timestamp.now(),
        ordersCovered: unpaidOrders.map(order => order.id),
      })
      setFeePaid(true)
      setUnpaidFee(0)
    } catch (err) {
      setFeePaid(false)
      alert("Failed to pay platform fee. Please try again.")
    } finally {
      setPaying(false)
    }
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

  if (error || !restaurant || !stats) {
    // Check for Firebase permission error
    if (error && error.toLowerCase().includes('permission')) {
      return (
        <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
          <p className="text-red-500">You do not have permission to view this data. Please contact support or check your account permissions.</p>
        </div>
      )
    }
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
        <p className="text-red-500">{error || "Failed to load dashboard"}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold">{restaurant.name} Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your restaurant and track performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <BarChart3 className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Restaurant Status */}
      <Card className="bg-white rounded-xl shadow-lg mb-8">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Store className="h-8 w-8 text-[var(--primary)]" />
              <div>
                <h3 className="text-lg font-semibold">Restaurant Status</h3>
                <p className="text-sm text-gray-600">
                  Your restaurant is currently{" "}
                  <span className={restaurant.isActive ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                    {restaurant.isActive ? "Active" : "Inactive"}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="text-sm text-gray-600">({stats.totalReviews} reviews)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white rounded-xl shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-gray-600">All time orders</p>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-gray-600">From completed orders</p>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Clock className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingOrders}</div>
            <p className="text-xs text-gray-600">Need attention</p>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Menu Items</CardTitle>
            <Package className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-gray-600">Available products</p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Fee Payment */}
      <Card className="bg-white rounded-xl shadow-lg mb-8">
        <CardHeader>
          <CardTitle>Platform Fee</CardTitle>
          <CardDescription>Pay your accumulated platform fee to the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div>
              <span className="font-medium">Unpaid Platform Fee: </span>
              <span className="text-lg">₹{unpaidFee.toFixed(2)}</span>
            </div>
            <Button onClick={handlePayFee} disabled={paying || unpaidFee <= 0}>
              {paying ? "Processing..." : feePaid ? "Fee Paid" : "Pay Platform Fee"}
            </Button>
            <Link href="/restaurant-owner/fees-history">
              <Button variant="outline" className="w-full mt-2">View Fee Payment History</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-white rounded-xl shadow-lg mb-8">
        <CardHeader>
          <CardTitle>Restaurant Management</CardTitle>
          <CardDescription>Manage your menu, orders, and restaurant settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/restaurant-owner/products">
              <Button className="w-full h-20 flex flex-col gap-2">
                <Package className="h-6 w-6" />
                <span>Manage Menu</span>
              </Button>
            </Link>

            <Link href="/restaurant-owner/orders">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <ShoppingCart className="h-6 w-6" />
                <span>View Orders</span>
              </Button>
            </Link>

            <Link href="/restaurant-owner/products">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <Plus className="h-6 w-6" />
                <span>Add Product</span>
              </Button>
            </Link>

            <Link href="/restaurant-owner/settings">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <Settings className="h-6 w-6" />
                <span>Settings</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders and Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <Card className="bg-white rounded-xl shadow-lg">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest orders for your restaurant</CardDescription>
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
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="font-medium">Created:</span> {restaurant?.createdAt instanceof Date ? restaurant.createdAt.toLocaleDateString() : 'N/A'}
                        </p>
                        <p>
                          <span className="font-medium">Updated:</span> {restaurant?.updatedAt instanceof Date ? restaurant.updatedAt.toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {order.orderDate instanceof Date ? order.orderDate.toLocaleDateString() : 'N/A'} at {order.orderDate instanceof Date ? order.orderDate.toLocaleTimeString() : 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{order.totalAmount.toFixed(2)}</p>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          order.status === "delivered"
                            ? "bg-green-100 text-green-800"
                            : order.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
                <Link href="/restaurant-owner/orders">
                  <Button variant="outline" className="w-full">
                    View All Orders
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="bg-white rounded-xl shadow-lg">
          <CardHeader>
            <CardTitle>Your Menu Items</CardTitle>
            <CardDescription>Your current product catalog</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topProducts.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No products yet</p>
                <Link href="/restaurant-owner/products">
                  <Button>Add Your First Product</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.topProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
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
                <Link href="/restaurant-owner/products">
                  <Button variant="outline" className="w-full">
                    Manage All Products
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
