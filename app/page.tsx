"use client";
// app/page.tsx
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import { Utensils, ChefHat, HeartHandshake, Leaf, Award, Users, ArrowLeft } from "lucide-react" // Added new icons
import { IndianFoodGallery } from "@/components/IndianFoodGallery"
import { useRouter } from "next/navigation"

export default function LandingPage() {
  const router = useRouter()

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)]">
      <div className="flex items-center gap-4 mb-8">
        {/* Remove <h1 className="text-4xl font-bold">Home</h1> from the homepage header */}
      </div>
      {/* Hero Section */}
      {/* To change the hero background image, update the URL in the style prop below */}
      <section
        className="relative w-full h-[60vh] md:h-[70vh] lg:h-[80vh] flex items-center justify-center text-center bg-cover bg-center"
        style={{ backgroundImage: "url('https://plus.unsplash.com/premium_photo-1673108852141-e8c3c22a4a22?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8Zm9vZHxlbnwwfHwwfHx8MA%3D%3D')" }}
      >
        <div className="absolute inset-0 bg-black/70" />
        <div className="relative z-10 text-white px-4 md:px-8">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 animate-fade-in-up">
            Authentic Indian Catering for Every Occasion
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto animate-fade-in-up delay-200">
            Bringing the rich flavors and traditions of rural India to your table, globally.
          </p>
          <Link href="/menu">
            <Button
              size="lg"
              className="bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 animate-fade-in-up delay-400"
            >
              View Our Menu
            </Button>
          </Link>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 md:py-24 bg-[var(--muted)]">
        <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="lg:order-1">
            <Image
              src="https://images.unsplash.com/photo-1616813769023-d0557572ddbe?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fGElMjBjdWxpbmFyeSUyMGpvdXJuZXklMjBmcm9tJTIwcnVyYWwlMjBpbmRpYXxlbnwwfHwwfHx8MA%3D%3D"
              alt="Our Story"
              width={700}
              height={500}
              className="rounded-lg shadow-xl w-full h-auto object-cover"
            />
          </div>
          <div className="lg:order-2 text-center lg:text-left">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Story: A Culinary Journey from Rural India</h2>
            <p className="text-lg text-[var(--muted-foreground)] mb-6">
              Catering was born from a passion to connect the vibrant culinary heritage of rural Indian towns with the
              global community. We saw an opportunity to empower local caterers, often overlooked, by providing a
              platform to showcase their authentic dishes and unique ingredients.
            </p>
            <p className="text-lg text-[var(--muted-foreground)] mb-8">
              Every dish on our menu carries the legacy of generations, prepared with traditional methods and the love
              of skilled hands. Our journey is about more than just food; it's about cultural exchange, sustainable
              livelihoods, and bringing genuine, heartwarming flavors to your home, no matter where you are.
            </p>
            <Link href="/profile">
              <Button size="lg" variant="outline" className="bg-[var(--foreground)] text-[var(--background)] hover:bg-[var(--muted)] animate-fade-in-up delay-400">
                Meet Our Team
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* What We Provide Section */}
      <section className="py-16 md:py-24 bg-[var(--background)]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">What We Provide</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6 flex flex-col items-center text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
              <Utensils className="h-12 w-12 text-[var(--primary)] mb-4" />
              <CardTitle className="text-xl font-semibold mb-2">Diverse Culinary Delights</CardTitle>
              <CardDescription>
                A wide array of traditional Indian dishes, from regional specialties to classic favorites, prepared with
                authentic recipes.
              </CardDescription>
            </Card>
            <Card className="p-6 flex flex-col items-center text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
              <ChefHat className="h-12 w-12 text-[var(--primary)] mb-4" />
              <CardTitle className="text-xl font-semibold mb-2">Expert Chefs & Quality Ingredients</CardTitle>
              <CardDescription>
                Our dishes are crafted by experienced chefs using fresh, locally sourced ingredients to ensure
                unparalleled taste and quality.
              </CardDescription>
            </Card>
            <Card className="p-6 flex flex-col items-center text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
              <HeartHandshake className="h-12 w-12 text-[var(--primary)] mb-4" />
              <CardTitle className="text-xl font-semibold mb-2">Customized Catering Solutions</CardTitle>
              <CardDescription>
                Whether it's a small gathering or a grand event, we offer flexible catering packages tailored to your
                specific needs and preferences.
              </CardDescription>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 md:py-24 bg-[var(--muted)]">
        <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="lg:order-2">
            <Image
              src="https://images.unsplash.com/photo-1652595802737-56d08ad31f09?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fFdoeSUyMENob29zZSUyMENhdGVyaW5nJTNGJTIwb24lMjBpbmRpYW4lMjBmb29kJTIwdGhlbWV8ZW58MHx8MHx8fDA%3D"
              alt="Why Choose Us"
              width={700}
              height={500}
              className="rounded-lg shadow-xl w-full h-auto object-cover"
            />
          </div>
          <div className="lg:order-1 text-center lg:text-left">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Why Choose Catering?</h2>
            <ul className="space-y-4 text-lg text-[var(--muted-foreground)] mb-8 list-none pl-0">
              <li className="flex items-start lg:items-center gap-3">
                <Leaf className="h-6 w-6 text-green-600 flex-shrink-0" />
                <span>
                  **Authenticity & Freshness:** We source directly from rural communities, ensuring genuine flavors and
                  the freshest ingredients.
                </span>
              </li>
              <li className="flex items-start lg:items-center gap-3">
                <Award className="h-6 w-6 text-yellow-600 flex-shrink-0" />
                <span>
                  **Empowering Communities:** Every order directly supports the livelihoods of talented local caterers.
                </span>
              </li>
              <li className="flex items-start lg:items-center gap-3">
                <Users className="h-6 w-6 text-blue-600 flex-shrink-0" />
                <span>
                  **Cultural Exchange:** Experience the diverse culinary traditions of India, one delicious dish at a
                  time.
                </span>
              </li>
            </ul>
            <Link href="/menu">
              <Button size="lg" className="bg-[var(--primary)] hover:bg-[var(--primary)]/90">
                Explore Our Offerings
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section
        className="relative py-16 md:py-24 bg-[var(--muted)] text-[var(--foreground)] text-center"
      >
        <div className="absolute inset-0 bg-[url('https://media.istockphoto.com/id/1471444483/photo/customer-satisfaction-survey-concept-users-rate-service-experiences-on-online-application.webp?a=1&b=1&s=612x612&w=0&k=20&c=vTedWOsRo4-O5hO_ZblfrCYNEHvmdTcU6cPCW8I1u60=')] bg-cover bg-center opacity-30 z-0" />
        <div className="absolute inset-0 bg-[var(--background)]/60 z-10" />
        <div className="relative z-20 container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">What Our Customers Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6 bg-[var(--background)]/10 backdrop-blur-sm text-[var(--foreground)] shadow-lg">
              <p className="italic mb-4">
                "The food was absolutely incredible! It felt like a true taste of India, delivered right to my door. The
                biryani was a masterpiece."
              </p>
              <p className="font-semibold">- Sarah L.</p>
            </Card>
            <Card className="p-6 bg-[var(--background)]/10 backdrop-blur-sm text-[var(--foreground)] shadow-lg">
              <p className="italic mb-4">
                "I ordered for a family gathering, and everyone was raving about the authentic flavors. It's amazing to
                support such a wonderful initiative."
              </p>
              <p className="font-semibold">- David K.</p>
            </Card>
            <Card className="p-6 bg-[var(--background)]/10 backdrop-blur-sm text-[var(--foreground)] shadow-lg">
              <p className="italic mb-4">
                "Beyond delicious! The quality and freshness were evident in every bite. This is my new go-to for
                catering."
              </p>
              <p className="font-semibold">- Priya S.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Gallery Preview Section */}
      <section className="py-16 md:py-24 bg-[var(--background)]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Gallery Preview</h2>
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            <div className="flex flex-col items-center">
              <Image src="https://media.istockphoto.com/id/1430753492/photo/indian-sweet-jalebi.webp?a=1&b=1&s=612x612&w=0&k=20&c=aO_1E0NcBstoEmqR8Bpw_eJpMT16eFUTcTdxHrOeHuM=" alt="Jalebi" width={220} height={150} className="rounded-lg shadow-md object-cover" />
              <span className="mt-2 font-medium">Jalebi</span>
            </div>
            <div className="flex flex-col items-center">
              <Image src="https://media.istockphoto.com/id/1455306682/photo/kachalu-chaat.webp?a=1&b=1&s=612x612&w=0&k=20&c=nE03ItYFZ3lUyvrLPpmKa0gG-FM8pFQPSHh0ZWW6p6w=" alt="Paneer Tikka" width={220} height={150} className="rounded-lg shadow-md object-cover" />
              <span className="mt-2 font-medium">Paneer Tikka</span>
            </div>
            <div className="flex flex-col items-center">
              <Image src="https://media.istockphoto.com/id/979914742/photo/chole-bhature-or-chick-pea-curry-and-fried-puri-served-in-terracotta-crockery-over-white.webp?a=1&b=1&s=612x612&w=0&k=20&c=8pmBVIcNb-GIFnsBT0sYqfy-YtzNq7pOqc6lQZgFOPo=" alt="Chole Bhature" width={220} height={150} className="rounded-lg shadow-md object-cover" />
              <span className="mt-2 font-medium">Chole Bhature</span>
            </div>
            <div className="flex flex-col items-center">
              <Image src="https://media.istockphoto.com/id/1257018928/photo/gujarati-khaman-dhokla-or-steamed-gram-flour-puffy-snack-cake.webp?a=1&b=1&s=612x612&w=0&k=20&c=YQTu_3O4g7MJ7iRqXrl634_J_SajzmaF-E9W51YdAOs=" alt="Dhokla" width={220} height={150} className="rounded-lg shadow-md object-cover" />
              <span className="mt-2 font-medium">Dhokla</span>
            </div>
          </div>
          <Link href="/food-gallery">
            <Button size="lg" variant="outline" className="bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90">
              See all photos
            </Button>
          </Link>
        </div>
      </section>

      {/* Call to Action Section (already exists, but keeping for completeness) */}
      <section className="py-16 md:py-24 bg-[var(--primary)] text-[var(--primary-foreground)] text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Experience Authentic Flavors?</h2>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
            Explore our diverse menu and let us cater your next event with unforgettable Indian cuisine.
          </p>
          <Link href="/menu">
            <Button size="lg" className="bg-[var(--primary-foreground)] text-[var(--primary)] hover:bg-[var(--primary-foreground)]/90">
              Browse Our Full Menu
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
