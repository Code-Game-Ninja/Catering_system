import Image from "next/image"
import { useState } from "react"

const FOODS = [
  {
    name: "Butter Chicken",
    src: "https://images.pexels.com/photos/461382/pexels-photo-461382.jpeg",
    description: "A rich and creamy North Indian curry made with tender chicken, tomatoes, butter, and aromatic spices.",
  },
  {
    name: "Masala Dosa",
    src: "https://images.pexels.com/photos/106343/pexels-photo-106343.jpeg",
    description: "A crispy South Indian crepe made from fermented rice and lentil batter, filled with spicy potato masala.",
  },
  {
    name: "Biryani",
    src: "https://images.pexels.com/photos/461382/pexels-photo-461382.jpeg",
    description: "A fragrant rice dish layered with marinated meat or vegetables, saffron, and whole spices.",
  },
  {
    name: "Samosa",
    src: "https://images.pexels.com/photos/461382/pexels-photo-461382.jpeg",
    description: "A popular snack of crispy pastry filled with spicy potatoes, peas, and herbs.",
  },
  {
    name: "Paneer Tikka",
    src: "https://images.pexels.com/photos/461382/pexels-photo-461382.jpeg",
    description: "Chunks of paneer (Indian cottage cheese) marinated in spices and grilled to perfection.",
  },
  {
    name: "Chole Bhature",
    src: "https://images.pexels.com/photos/106343/pexels-photo-106343.jpeg",
    description: "A North Indian classic: spicy chickpea curry served with deep-fried bread (bhature).",
  },
  {
    name: "Dhokla",
    src: "https://images.pexels.com/photos/106343/pexels-photo-106343.jpeg",
    description: "A light and fluffy steamed cake made from fermented rice and chickpea flour, popular in Gujarat.",
  },
  {
    name: "Gulab Jamun",
    src: "https://images.pexels.com/photos/461382/pexels-photo-461382.jpeg",
    description: "Soft, deep-fried milk balls soaked in fragrant sugar syrup, a beloved Indian dessert.",
  },
  // Additional food items
  {
    name: "Rogan Josh",
    src: "https://images.pexels.com/photos/461382/pexels-photo-461382.jpeg",
    description: "A flavorful Kashmiri curry made with tender lamb or goat, yogurt, and aromatic spices.",
  },
  {
    name: "Idli Sambhar",
    src: "https://images.pexels.com/photos/106343/pexels-photo-106343.jpeg",
    description: "Steamed rice cakes served with spicy lentil soup and coconut chutney, a South Indian breakfast staple.",
  },
  {
    name: "Pav Bhaji",
    src: "https://images.pexels.com/photos/461382/pexels-photo-461382.jpeg",
    description: "A spicy mashed vegetable curry served with buttered bread rolls, a Mumbai street food favorite.",
  },
  {
    name: "Jalebi",
    src: "https://images.pexels.com/photos/461382/pexels-photo-461382.jpeg",
    description: "Crispy, spiral-shaped sweets soaked in sugar syrup, enjoyed across India as a dessert or snack.",
  },
  {
    name: "Fish Curry",
    src: "https://images.pexels.com/photos/106343/pexels-photo-106343.jpeg",
    description: "A tangy and spicy curry made with fresh fish, coconut, and regional spices, popular in coastal India.",
  },
  {
    name: "Rajma Chawal",
    src: "https://images.pexels.com/photos/106343/pexels-photo-106343.jpeg",
    description: "Red kidney beans cooked in a thick tomato gravy, served with steamed rice, a North Indian comfort food.",
  },
  {
    name: "Pani Puri",
    src: "https://images.pexels.com/photos/106343/pexels-photo-106343.jpeg",
    description: "Crispy hollow puris filled with spicy, tangy water and potatoes, a beloved Indian street snack.",
  },
  {
    name: "Rasgulla",
    src: "https://images.pexels.com/photos/461382/pexels-photo-461382.jpeg",
    description: "Soft, spongy balls made from chenna (Indian cottage cheese) soaked in light sugar syrup, a Bengali dessert.",
  },
]

export function IndianFoodGallery() {
  const [hovered, setHovered] = useState<number | null>(null)
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">Indian Food Gallery</h2>
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