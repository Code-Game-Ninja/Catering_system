"use client"

import Image from "next/image"
import { useState } from "react"

const FOODS = [
  {
    name: "Masala Dosa",
    src: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8TWFzYWxhJTIwRG9zYXxlbnwwfHwwfHx8MA%3D%3D",
    description: "A crispy South Indian crepe made from fermented rice and lentil batter, filled with spicy potato masala.",
  },
  {
    name: "Paneer Tikka",
    src: "https://media.istockphoto.com/id/1455306682/photo/kachalu-chaat.webp?a=1&b=1&s=612x612&w=0&k=20&c=nE03ItYFZ3lUyvrLPpmKa0gG-FM8pFQPSHh0ZWW6p6w=",
    description: "Chunks of paneer (Indian cottage cheese) marinated in spices and grilled to perfection.",
  },
  {
    name: "Chole Bhature",
    src: "https://media.istockphoto.com/id/979914742/photo/chole-bhature-or-chick-pea-curry-and-fried-puri-served-in-terracotta-crockery-over-white.webp?a=1&b=1&s=612x612&w=0&k=20&c=8pmBVIcNb-GIFnsBT0sYqfy-YtzNq7pOqc6lQZgFOPo=",
    description: "A North Indian classic: spicy chickpea curry served with deep-fried bread (bhature).",
  },
  {
    name: "Dhokla",
    src: "https://media.istockphoto.com/id/1257018928/photo/gujarati-khaman-dhokla-or-steamed-gram-flour-puffy-snack-cake.webp?a=1&b=1&s=612x612&w=0&k=20&c=YQTu_3O4g7MJ7iRqXrl634_J_SajzmaF-E9W51YdAOs=",
    description: "A light and fluffy steamed cake made from fermented rice and chickpea flour, popular in Gujarat.",
  },
  {
    name: "Idli Sambhar",
    src: "https://media.istockphoto.com/id/1024549454/photo/idly-sambar-or-idli-with-sambhar-and-green-red-chutney-popular-south-indian-breakfast.webp?a=1&b=1&s=612x612&w=0&k=20&c=JGYk6zJNS6bneptDScV-2P8PrH2EirPA1qH3KKW8_9w=",
    description: "Steamed rice cakes served with spicy lentil soup and coconut chutney, a South Indian breakfast staple.",
  },
  {
    name: "Pav Bhaji",
    src: "https://media.istockphoto.com/id/1327433011/photo/pav-bhaji-indian-street-food-bharuch-gujarat-india.webp?a=1&b=1&s=612x612&w=0&k=20&c=wuk8_FqsHJwFTKvpAMt6iA7fsN0zROVmeSpJ9O9_cmE=",
    description: "A spicy mashed vegetable curry served with buttered bread rolls, a Mumbai street food favorite.",
  },
  {
    name: "Rajma Chawal",
    src: "https://media.istockphoto.com/id/669635320/photo/kidney-bean-curry-or-rajma-or-rajmah-chawal-and-roti-typical-north-indian-main-course.webp?a=1&b=1&s=612x612&w=0&k=20&c=fQvk0ylYuRflBkPZ8aTUHwtcNkdeNqofVH9VjT4C2a0=",
    description: "Red kidney beans cooked in a thick tomato gravy, served with steamed rice, a North Indian comfort food.",
  },
  {
    name: "Pani Puri",
    src: "https://media.istockphoto.com/id/1314329942/photo/goal-gappa-or-pani-puri.webp?a=1&b=1&s=612x612&w=0&k=20&c=gipl8gjcid4yNp9cIjVEvhyAFdlFyplwGXYgRv0jdoI=",
    description: "Crispy hollow puris filled with spicy, tangy water and potatoes, a beloved Indian street snack.",
  },
  {
    name: "Aloo Paratha",
    src: "https://media.istockphoto.com/id/1279134709/photo/image-of-metal-tray-with-aloo-paratha-pile-topped-with-red-onion-rings-and-sprinkle-of.webp?a=1&b=1&s=612x612&w=0&k=20&c=BqI3olbZz2Ljg3LaEiLWYq2vQ8wfORCYdPrwKmJ2WbU=",
    description: "Whole wheat flatbread stuffed with spiced mashed potatoes, served with butter and yogurt.",
  },
  {
    name: "Gulab Jamun",
    src: "https://media.istockphoto.com/id/1188000786/photo/gulab-jamun-in-bowl-on-wooden-background-indian-dessert-or-sweet-dish.webp?a=1&b=1&s=612x612&w=0&k=20&c=4kVDa_BP4pypOSvfDSL2mmLNO3SYdoAs1VG-qi4WAtI=",
    description: "Soft, deep-fried milk balls soaked in fragrant sugar syrup, a beloved Indian dessert.",
  },
  {
    name: "Jalebi",
    src: "https://media.istockphoto.com/id/1430753492/photo/indian-sweet-jalebi.webp?a=1&b=1&s=612x612&w=0&k=20&c=aO_1E0NcBstoEmqR8Bpw_eJpMT16eFUTcTdxHrOeHuM=",
    description: "Crispy, spiral-shaped sweets soaked in sugar syrup, enjoyed across India as a dessert or snack.",
  },
  {
    name: "Daal Tadka",
    src: "https://media.istockphoto.com/id/495455544/photo/red-lentil-indian-soup-with-flat-bread-masoor-dal.webp?a=1&b=1&s=612x612&w=0&k=20&c=FL1aWzFzs_cMsxHj4QIE-dUudiOzV1eK0JjGr5CJd80=",
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