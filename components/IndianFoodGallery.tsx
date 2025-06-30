"use client"

import Image from "next/image"
import { useState } from "react"

const FOODS = [
  {
    name: "Masala Dosa",
    src: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
    description: "A crispy South Indian crepe made from fermented rice and lentil batter, filled with spicy potato masala.",
  },
  {
    name: "Paneer Tikka",
    src: "https://images.unsplash.com/photo-1600628422019-6c1a9b7b8c5e?auto=format&fit=crop&w=600&q=80",
    description: "Chunks of paneer (Indian cottage cheese) marinated in spices and grilled to perfection.",
  },
  {
    name: "Chole Bhature",
    src: "https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&w=600&q=80",
    description: "A North Indian classic: spicy chickpea curry served with deep-fried bread (bhature).",
  },
  {
    name: "Dhokla",
    src: "https://images.unsplash.com/photo-1608131596337-cd3c3c7c1bfc?auto=format&fit=crop&w=600&q=80",
    description: "A light and fluffy steamed cake made from fermented rice and chickpea flour, popular in Gujarat.",
  },
  {
    name: "Idli Sambhar",
    src: "https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=600&q=80",
    description: "Steamed rice cakes served with spicy lentil soup and coconut chutney, a South Indian breakfast staple.",
  },
  {
    name: "Pav Bhaji",
    src: "https://images.unsplash.com/photo-1606788075761-9c3e1e26c9b6?auto=format&fit=crop&w=600&q=80",
    description: "A spicy mashed vegetable curry served with buttered bread rolls, a Mumbai street food favorite.",
  },
  {
    name: "Rajma Chawal",
    src: "https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&w=600&q=80",
    description: "Red kidney beans cooked in a thick tomato gravy, served with steamed rice, a North Indian comfort food.",
  },
  {
    name: "Pani Puri",
    src: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=600&q=80",
    description: "Crispy hollow puris filled with spicy, tangy water and potatoes, a beloved Indian street snack.",
  },
  {
    name: "Aloo Paratha",
    src: "https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=600&q=80",
    description: "Whole wheat flatbread stuffed with spiced mashed potatoes, served with butter and yogurt.",
  },
  {
    name: "Gulab Jamun",
    src: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
    description: "Soft, deep-fried milk balls soaked in fragrant sugar syrup, a beloved Indian dessert.",
  },
  {
    name: "Jalebi",
    src: "https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=600&q=80",
    description: "Crispy, spiral-shaped sweets soaked in sugar syrup, enjoyed across India as a dessert or snack.",
  },
  {
    name: "Daal Tadka",
    src: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=600&q=80",
    description: "Yellow lentils cooked with onions, tomatoes, and spices, finished with a tempering of ghee and cumin.",
  },
]

export function IndianFoodGallery() {
  const [hovered, setHovered] = useState<number | null>(null)
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">Indian Veg Food Gallery</h2>
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {FOODS.map((food, idx) => (
            <div
              key={idx}
              className="break-inside-avoid rounded-lg overflow-hidden shadow-lg bg-white mb-4 relative group"
              onMouseEnter={() => setHovered(idx)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="relative w-full aspect-[4/3]">
                <Image
                  src={food.src}
                  alt={food.name}
                  fill
                  className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
                {/* Overlay for details on hover */}
                <div
                  className={`absolute inset-0 bg-black/70 text-white flex flex-col items-center justify-center px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${hovered === idx ? 'opacity-100' : 'opacity-0'}`}
                  style={{ pointerEvents: hovered === idx ? 'auto' : 'none' }}
                >
                  <div className="font-bold text-lg mb-2">{food.name}</div>
                  <div className="text-sm text-center">{food.description}</div>
                </div>
              </div>
              <div className="p-3 text-center font-semibold text-lg text-gray-800 bg-white">
                {food.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
} 