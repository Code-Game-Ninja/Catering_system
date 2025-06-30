import { IndianFoodGallery } from "@/components/IndianFoodGallery"

export default function FoodGalleryPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-center mb-4">Indian Food Gallery</h1>
        <p className="text-lg text-gray-600 text-center mb-10">
          Explore the vibrant diversity of Indian cuisine! Hover over each dish to see its details.
        </p>
        <IndianFoodGallery />
      </div>
    </div>
  )
} 