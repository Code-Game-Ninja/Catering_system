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
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <span style={{ fontSize: '4rem' }}>🚧</span>
      <h1 className="text-3xl font-bold mt-4 mb-2">Page Under Construction</h1>
      <p className="text-lg text-gray-600">The fee payment history feature is coming soon. Please check back later!</p>
    </div>
  );
} 