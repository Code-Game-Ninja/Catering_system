"use client"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const PAYMENT_METHODS = [
  { label: "Cash on Delivery (COD)", value: "cod", available: true },
  { label: "UPI (Under Construction)", value: "upi", available: false },
  { label: "Card Payment (Under Construction)", value: "card", available: false },
  { label: "Net Banking (Under Construction)", value: "netbanking", available: false },
]

export default function PaymentPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")
  const [selected, setSelected] = useState("cod")
  const [submitting, setSubmitting] = useState(false)

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selected !== "cod") {
      alert("This payment method is under construction. Please select COD.")
      return
    }
    setSubmitting(true)
    setTimeout(() => {
      alert(`Order #${orderId?.substring(0, 8)} set for COD. Thank you!`)
      router.push("/my-orders")
    }, 1200)
  }

  return (
    <div className="min-h-screen py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8">Select Payment Method</h1>
        <div className="max-w-xl mx-auto">
          <Card className="bg-white rounded-xl shadow-lg">
            <CardHeader>
              <CardTitle>Payment Options</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePay} className="space-y-6">
                <div className="space-y-3">
                  {PAYMENT_METHODS.map((method) => (
                    <label
                      key={method.value}
                      className={`flex items-center gap-3 p-3 rounded border ${selected === method.value ? "border-[var(--primary)] bg-[var(--primary)]/10" : "border-gray-200"} ${!method.available ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={method.value}
                        checked={selected === method.value}
                        onChange={() => setSelected(method.value)}
                        disabled={!method.available}
                        className="accent-primary h-4 w-4"
                      />
                      <span className="font-medium">{method.label}</span>
                      {!method.available && (
                        <span className="ml-2 text-xs text-yellow-600">(Under Construction)</span>
                      )}
                    </label>
                  ))}
                </div>
                <div className="text-sm text-gray-500">
                  Note: Only Cash on Delivery (COD) is available at this time. Other payment methods are coming soon!
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Processing..." : "Confirm & Checkout"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 