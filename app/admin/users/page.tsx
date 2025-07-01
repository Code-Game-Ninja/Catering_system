"use client"

import { useState, useEffect, useMemo } from "react"
import { collection, getDocs, getDoc, doc, updateDoc, deleteDoc, query, orderBy, onSnapshot } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { log } from "@/lib/logging"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Search, User, Trash2, CheckCircle, XCircle } from "lucide-react"

interface UserProfile {
  uid: string
  email: string
  name?: string
  role: "user" | "restaurant_owner" | "admin"
  isVerified: boolean
  restaurantId?: string
  address?: string
  phone?: string
  createdAt?: Date
  updatedAt?: Date
}

type UserRole = "user" | "restaurant_owner" | "admin"

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState<UserRole | "all">("all")
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid)
        const userDocSnap = await getDoc(userDocRef)

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data() as UserProfile

          if (userData?.role === "admin") {
            setUserRole("admin")
            fetchUsers()
          } else {
            log("warn", "Unauthorized access attempt to admin users page", { uid: user.uid })
            router.push("/")
          }
        } else {
          log("warn", "User document not found", { uid: user.uid })
          router.push("/")
        }
      } else {
        log("info", "No user logged in, redirecting to login for admin users page")
        router.push("/login")
      }
    })
    return () => unsubscribe()
  }, [router])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const usersCollection = collection(db, "users")
      const usersQuery = query(usersCollection, orderBy("createdAt", "desc"))
      const unsubscribe = onSnapshot(usersQuery, (usersSnapshot) => {
        const fetchedUsers = usersSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            uid: doc.id,
            ...data,
            createdAt: data.createdAt && typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : data.createdAt,
            updatedAt: data.updatedAt && typeof data.updatedAt.toDate === 'function' ? data.updatedAt.toDate() : data.updatedAt,
          } as unknown as UserProfile;
        })
        setUsers(fetchedUsers)
        log("info", "User list fetched successfully for admin (real-time)", { count: fetchedUsers.length })
        setLoading(false)
      })
      return unsubscribe
    } catch (err: any) {
      log("error", "Failed to fetch users for admin", { error: err.message })
      setError("Failed to load users. Please try again later.")
      console.error("Error fetching users:", err)
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      const userDocRef = doc(db, "users", userId)
      await updateDoc(userDocRef, { role: newRole, updatedAt: new Date() })
      setUsers((prevUsers) => prevUsers.map((user) => (user.uid === userId ? { ...user, role: newRole } : user)))
      log("info", `User role updated: ${userId} to ${newRole}`)
    } catch (err: any) {
      log("error", `Failed to update user role: ${userId} to ${newRole}`, { error: err.message })
      console.error("Error updating user role:", err)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      const userDocRef = doc(db, "users", userId)
      await deleteDoc(userDocRef)
      setUsers((prevUsers) => prevUsers.filter((user) => user.uid !== userId))
      log("info", `User deleted: ${userId}`)
    } catch (err: any) {
      log("error", `Failed to delete user: ${userId}`, { error: err.message })
      console.error("Error deleting user:", err)
    }
  }

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesRole = filterRole === "all" || user.role === filterRole
      return matchesSearch && matchesRole
    })
  }, [users, searchTerm, filterRole])

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

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold">Manage Users</h1>
          <p className="text-gray-600 mt-2">View and manage all user accounts on the platform</p>
        </div>
        <Button onClick={fetchUsers} variant="outline">
          <User className="mr-2 h-4 w-4" />
          Refresh Users
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter Users</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterRole} onValueChange={(value: UserRole | "all") => setFilterRole(value)}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="restaurant_owner">Restaurant Owner</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User List ({filteredUsers.length} users)</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No users found matching your criteria.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead>Restaurant ID</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.uid}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{user.name || "N/A"}</TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(newRole: UserRole) => handleRoleChange(user.uid, newRole)}
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Select Role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="restaurant_owner">Restaurant Owner</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {user.isVerified ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {user.restaurantId ? (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            {user.restaurantId.substring(0, 8)}...
                          </span>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {user.createdAt instanceof Date ? user.createdAt.toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="icon">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the user account{" "}
                                  <span className="font-bold">{user.email}</span> and remove their data from our
                                  servers.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteUser(user.uid)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
