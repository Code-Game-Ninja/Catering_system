"use client";

import { IndianFoodGallery } from "@/components/IndianFoodGallery"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function FoodGalleryPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-2 mb-8">
          <Button variant="back" onClick={() => router.back()} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold">Food Gallery</h1>
        </div>
        <p className="text-lg text-gray-600 text-center mb-10">
          Explore the vibrant diversity of Indian cuisine! Hover over each dish to see its details.
        </p>
        <IndianFoodGallery />
      </div>
    </div>
  )
} 