"use client"
import { useEffect, useState } from "react"
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface PlatformFeeRecord {
  id: string
  amount: number
  paidAt: Timestamp
  ordersCovered: string[]
}

export default function RestaurantFeeHistoryPage() {
  const [feeHistory, setFeeHistory] = useState<PlatformFeeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let unsubscribeAuth: any
    unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) return setError("Not logged in")
      // Get restaurantId from user profile
      const userDoc = await getDocs(query(collection(db, "users"), where("uid", "==", user.uid)))
      const userData = userDoc.docs[0]?.data()
      if (!userData?.restaurantId) return setError("No restaurant found for user")
      // Fetch fee records
      const feesQuery = query(collection(db, "platformFees"), where("restaurantId", "==", userData.restaurantId))
      const feesSnapshot = await getDocs(feesQuery)
      const records = feesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PlatformFeeRecord[]
      setFeeHistory(records)
      setLoading(false)
    })
    return () => unsubscribeAuth && unsubscribeAuth()
  }, [])

  if (loading) return <LoadingSpinner />
  if (error) return <div className="text-red-500 p-4">{error}</div>

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Platform Fee Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {feeHistory.length === 0 ? (
            <div className="text-gray-500">No fee payments found.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left p-2">Amount</th>
                  <th className="text-left p-2">Paid At</th>
                  <th className="text-left p-2">Orders Covered</th>
                </tr>
              </thead>
              <tbody>
                {feeHistory.map(fee => (
                  <tr key={fee.id} className="border-t">
                    <td className="p-2">${fee.amount.toFixed(2)}</td>
                    <td className="p-2">{fee.paidAt?.toDate?.().toLocaleString?.() || "-"}</td>
                    <td className="p-2">{fee.ordersCovered?.length || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 