import { useEffect, useState } from "react"

const ADS = [
  "🎉 First order free! Use code: WELCOME",
  "🍽️ Order now and get 10% off!",
  "🔥 Hot deals on group catering!",
  "💸 Discounts available for bulk orders!",
  "🚚 Fast delivery to your doorstep!",
]

export function RotatingAds() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % ADS.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="text-center text-yellow-600 font-semibold text-base animate-fade-in-up">
      {ADS[index]}
    </div>
  )
} 