"use client"
import { useEffect, useState } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface PlatformFeeRecord {
  id: string
  restaurantId: string
  amount: number
  paidAt: any
  ordersCovered: string[]
}

export default function AdminFeeHistoryPage() {
  const [feeHistory, setFeeHistory] = useState<PlatformFeeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchFees() {
      try {
        const feesSnapshot = await getDocs(collection(db, "platformFees"))
        const records = feesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PlatformFeeRecord[]
        setFeeHistory(records)
      } catch (err: any) {
        setError("Failed to fetch fee history")
      } finally {
        setLoading(false)
      }
    }
    fetchFees()
  }, [])

  if (loading) return <LoadingSpinner />
  if (error) return <div className="text-red-500 p-4">{error}</div>

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>All Platform Fee Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {feeHistory.length === 0 ? (
            <div className="text-gray-500">No fee payments found.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left p-2">Restaurant ID</th>
                  <th className="text-left p-2">Amount</th>
                  <th className="text-left p-2">Paid At</th>
                  <th className="text-left p-2">Orders Covered</th>
                </tr>
              </thead>
              <tbody>
                {feeHistory.map(fee => (
                  <tr key={fee.id} className="border-t">
                    <td className="p-2">{fee.restaurantId}</td>
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