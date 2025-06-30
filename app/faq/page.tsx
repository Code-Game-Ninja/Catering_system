"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function FAQPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 mb-8">
          <Button variant="back" onClick={() => router.back()} className="p-2 md:hidden">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold">Frequently Asked Questions</h1>
        </div>
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>What areas do you deliver to?</CardTitle>
            </CardHeader>
            <CardContent>
              We currently deliver to major cities across India and are expanding internationally. Check our delivery areas during checkout.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>How far in advance should I place my order?</CardTitle>
            </CardHeader>
            <CardContent>
              For regular orders, 24 hours notice is sufficient. For large events or catering, we recommend 3-7 days advance notice.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Do you accommodate dietary restrictions?</CardTitle>
            </CardHeader>
            <CardContent>
              Yes! We offer vegetarian, vegan, gluten-free, and other dietary options. Please specify your requirements when ordering.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>How can I contact support?</CardTitle>
            </CardHeader>
            <CardContent>
              You can reach us via the contact form, email, or phone listed in the footer. For urgent issues, use the Support page.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 