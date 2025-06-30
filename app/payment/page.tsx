import { Suspense } from "react"
import PaymentPageContent from "./PaymentPageContent"

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className='min-h-screen flex items-center justify-center'>Loading payment options...</div>}>
      <PaymentPageContent />
    </Suspense>
  )
} 