"use client";
import { Suspense } from "react"
import PaymentPageContent from "./PaymentPageContent"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function PaymentPage() {
  const router = useRouter()

  return (
    <Suspense fallback={<div className='min-h-screen flex items-center justify-center'>Loading payment options...</div>}>
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => router.back()} className="p-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-4xl font-bold">Payment</h1>
      </div>
      <PaymentPageContent />
    </Suspense>
  )
} 