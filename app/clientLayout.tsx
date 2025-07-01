"use client"
import type React from "react"

import { Inter } from "next/font/google"
import "./globals.css"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { auth, db } from "@/lib/firebase"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { log } from "@/lib/logging"
import {
  ShoppingCart,
  User,
  LogOut,
  Home,
  Package,
  ListOrdered,
  BookText,
  Loader2,
  Search,
  Phone,
  Mail,
  MapPin,
  Store,
  Menu,
} from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { doc, getDoc } from "firebase/firestore"
import type { UserProfile } from "@/lib/types"
import { RotatingAds } from "@/components/RotatingAds"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

const inter = Inter({ subsets: ["latin"] })

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [user, setUser] = useState<any>(null)
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()
  const pathname = usePathname()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid)
          const userDocSnap = await getDoc(userDocRef)
          if (userDocSnap.exists()) {
            setUserProfile(userDocSnap.data() as UserProfile)
          } else {
            // Handle case where user doc might not exist immediately after new registration
            // This should ideally be handled during registration, but as a fallback:
            setUserProfile({ uid: currentUser.uid, email: currentUser.email || "", role: "user", isVerified: false })
          }
        } catch (err) {
          log("error", "Failed to fetch user profile in ClientLayout", { uid: currentUser.uid, error: err })
          setUserProfile(null) // Ensure profile is null on error
        }
      } else {
        setUserProfile(null)
      }
      setLoadingAuth(false)
      log("info", "Auth state changed", { user: currentUser ? currentUser.uid : "none" })
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    function updateCartCount() {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]")
      setCartCount((cart as any[]).reduce((sum: number, item: any) => sum + (item.quantity || 1), 0))
    }
    updateCartCount()
    window.addEventListener("storage", updateCartCount)
    window.addEventListener("cart-updated", updateCartCount)
    return () => {
      window.removeEventListener("storage", updateCartCount)
      window.removeEventListener("cart-updated", updateCartCount)
    }
  }, [])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      log("info", "User logged out")
      router.push("/login")
    } catch (error) {
      log("error", "Logout failed", { error })
      console.error("Logout failed:", error)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery("")
    }
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
          <div className="bg-white/90 rounded-xl shadow-lg border mt-4">
            <header className="bg-[var(--primary)] text-[var(--primary-foreground)] p-4 shadow-md rounded-xl">
              <nav className="w-full">
                {/* Top row with logo and auth */}
                <div className="flex justify-between items-center mb-4">
                  <Link href="/" className="text-2xl font-bold">
                    Catering
                  </Link>
                  <div className="md:hidden">
                    <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                      <SheetTrigger asChild>
                        <button className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-white">
                          <Menu className="h-6 w-6" />
                          <span className="sr-only">Open navigation menu</span>
                        </button>
                      </SheetTrigger>
                      <SheetContent side="left" className="bg-white text-gray-900 border-r border-gray-200 shadow-lg">
                        <SheetHeader>
                          <SheetTitle>Menu</SheetTitle>
                        </SheetHeader>
                        <div className="flex flex-col gap-4 mt-6">
                          <Link href="/" onClick={() => setMobileNavOpen(false)}>
                            <Button variant="ghost" size="lg" className="w-full justify-start">
                              Home
                            </Button>
                          </Link>
                          <Link href="/menu" onClick={() => setMobileNavOpen(false)}>
                            <Button variant="ghost" size="lg" className="w-full justify-start">
                              Menu
                            </Button>
                          </Link>
                          <Link href="/about" onClick={() => setMobileNavOpen(false)}>
                            <Button variant="ghost" size="lg" className="w-full justify-start">
                              About
                            </Button>
                          </Link>
                          <Link href="/contact" onClick={() => setMobileNavOpen(false)}>
                            <Button variant="ghost" size="lg" className="w-full justify-start">
                              Contact
                            </Button>
                          </Link>
                          {user && (
                            <>
                              <Link href="/cart" onClick={() => setMobileNavOpen(false)}>
                                <div className="relative w-full">
                                  <Button variant="ghost" size="lg" className="w-full justify-start">
                                    Cart
                                    {cartCount > 0 && (
                                      <span className="absolute top-2 right-4 bg-red-500 text-white rounded-full text-xs px-1 min-w-[18px] text-center">
                                        {cartCount}
                                      </span>
                                    )}
                                  </Button>
                                </div>
                              </Link>
                              <Link href="/my-orders" onClick={() => setMobileNavOpen(false)}>
                                <Button variant="ghost" size="lg" className="w-full justify-start">
                                  Orders
                                </Button>
                              </Link>
                              {userProfile?.role === "restaurant_owner" && (
                                <Link href="/restaurant-owner" onClick={() => setMobileNavOpen(false)}>
                                  <Button variant="ghost" size="lg" className="w-full justify-start">
                                    Restaurant Dashboard
                                  </Button>
                                </Link>
                              )}
                              {userProfile?.role === "admin" && (
                                <Link href="/admin" onClick={() => setMobileNavOpen(false)}>
                                  <Button variant="ghost" size="lg" className="w-full justify-start">
                                    Admin
                                  </Button>
                                </Link>
                              )}
                            </>
                          )}
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                  {/* Desktop Rotating Ads/Announcements Section */}
                  <div className="hidden md:flex flex-1 max-w-md mx-8 items-center justify-center">
                    <RotatingAds />
                  </div>
                  <div className="flex items-center space-x-2">
                    {loadingAuth ? (
                      <div className="h-8 w-8 flex items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-[var(--primary-foreground)]" />
                      </div>
                    ) : user ? (
                      <>
                        <Link href="/profile">
                          <Button variant="ghost" size="sm" className="text-[var(--primary-foreground)]">
                            <User className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm" className="text-[var(--primary-foreground)]" onClick={handleLogout}>
                          <LogOut className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Link href="/login">
                        <Button variant="ghost" size="sm" className="text-[var(--primary-foreground)]">
                          Login
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Desktop Navigation Links */}
                <div className="hidden md:flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <Link href="/">
                      <Button variant="ghost" size="sm" className="text-[var(--primary-foreground)]">
                        <Home className="mr-2 h-4 w-4" /> Home
                      </Button>
                    </Link>
                    <Link href="/menu">
                      <Button variant="ghost" size="sm" className="text-[var(--primary-foreground)]">
                        <BookText className="mr-2 h-4 w-4" /> Menu
                      </Button>
                    </Link>
                    <Link href="/about">
                      <Button variant="ghost" size="sm" className="text-[var(--primary-foreground)]">
                        About
                      </Button>
                    </Link>
                    <Link href="/contact">
                      <Button variant="ghost" size="sm" className="text-[var(--primary-foreground)]">
                        Contact
                      </Button>
                    </Link>
                  </div>

                  {user && (
                    <div className="flex items-center space-x-1">
                      <Link href="/cart">
                        <div className="relative">
                          <Button variant="ghost" size="sm" className="text-[var(--primary-foreground)]">
                            <ShoppingCart className="h-4 w-4" />
                            {cartCount > 0 && (
                              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs px-1 min-w-[18px] text-center">
                                {cartCount}
                              </span>
                            )}
                          </Button>
                        </div>
                      </Link>
                      <Link href="/my-orders">
                        <Button variant="ghost" size="sm" className="text-[var(--primary-foreground)]">
                          <ListOrdered className="mr-2 h-4 w-4" /> Orders
                        </Button>
                      </Link>
                      {userProfile?.role === "restaurant_owner" && (
                        <Link href="/restaurant-owner">
                          <Button variant="ghost" size="sm" className="text-[var(--primary-foreground)]">
                            <Store className="mr-2 h-4 w-4" /> Restaurant Dashboard
                          </Button>
                        </Link>
                      )}
                      {userProfile?.role === "admin" && (
                        <Link href="/admin">
                          <Button variant="ghost" size="sm" className="text-[var(--primary-foreground)]">
                            <Package className="mr-2 h-4 w-4" /> Admin
                          </Button>
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </nav>
            </header>
          </div>

          <AnimatePresence mode="wait">
            <motion.main
              key={pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="min-h-[calc(100vh-64px)] bg-background text-foreground w-full"
            >
              {children}
            </motion.main>
          </AnimatePresence>

          {/* Footer */}
          <footer className="bg-[var(--muted)] text-foreground py-12 mt-16 w-full">
            <div className="px-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Company Info */}
                <div>
                  <h3 className="text-xl font-bold mb-4">Catering</h3>
                  <p className="text-muted-foreground mb-4">
                    Bringing authentic Indian flavors from rural communities to your table, supporting traditional
                    caterers worldwide.
                  </p>
                  <div className="flex space-x-4">
                    <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                      </svg>
                    </a>
                    <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
                      </svg>
                    </a>
                    <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z.017-.001z" />
                      </svg>
                    </a>
                  </div>
                </div>

                {/* Quick Links */}
                <div>
                  <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
                  <ul className="space-y-2">
                    <li>
                      <Link href="/menu" className="text-muted-foreground hover:text-foreground transition-colors">
                        Menu
                      </Link>
                    </li>
                    <li>
                      <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                        About Us
                      </Link>
                    </li>
                    <li>
                      <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                        Contact
                      </Link>
                    </li>
                    <li>
                      <Link href="/faq" className="text-muted-foreground hover:text-foreground transition-colors">
                        FAQ
                      </Link>
                    </li>
                    <li>
                      <Link href="/support" className="text-muted-foreground hover:text-foreground transition-colors">
                        Support
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Customer Service */}
                <div>
                  <h4 className="text-lg font-semibold mb-4">Customer Service</h4>
                  <ul className="space-y-2">
                    <li>
                      <Link href="/my-orders" className="text-muted-foreground hover:text-foreground transition-colors">
                        My Orders
                      </Link>
                    </li>
                    <li>
                      <Link href="/profile" className="text-muted-foreground hover:text-foreground transition-colors">
                        My Profile
                      </Link>
                    </li>
                    <li>
                      <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                        FAQ
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                        Support
                      </a>
                    </li>
                  </ul>
                </div>

                {/* Contact Info */}
                <div>
                  <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>6375960815</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>chiragmishra2511@gmail.com</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>kishangarh ajmer rajasthan pincode 305801</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-800 mt-8 pt-8 text-center text-muted-foreground">
                <p>&copy; 2024 Catering Platform. All rights reserved. Made with ❤️ for authentic Indian cuisine.</p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
