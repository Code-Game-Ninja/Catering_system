"use client";
// app/about/page.tsx
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, Users, Globe, Award, Utensils, Truck, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function AboutPage() {
  const teamMembers = [
    {
      name: "Chirag Mishra",
      role: "Founder & CEO",
      image: "https://plus.unsplash.com/premium_photo-1663091633166-20ef12aa7b4e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fHByb2Zlc3Npb25hbCUyMGhhY2tlcnxlbnwwfHwwfHx8MA%3D%3D",
      description:
        "Born in rural Punjab, Chirag brings 15+ years of culinary expertise and a passion for authentic Indian flavors.",
    }
  ]

  const values = [
    {
      icon: <Heart className="h-8 w-8 text-red-500" />,
      title: "Authenticity",
      description: "Every recipe is sourced from traditional family kitchens and prepared with genuine ingredients.",
    },
    {
      icon: <Users className="h-8 w-8 text-blue-500" />,
      title: "Community",
      description: "Supporting local farmers and caterers while building bridges between cultures through food.",
    },
    {
      icon: <Globe className="h-8 w-8 text-green-500" />,
      title: "Global Reach",
      description: "Bringing the taste of rural India to food lovers around the world.",
    },
    {
      icon: <Award className="h-8 w-8 text-yellow-500" />,
      title: "Quality",
      description: "Uncompromising standards in ingredients, preparation, and delivery.",
    },
  ]

  const stats = [
    { number: "10,000+", label: "Happy Customers" },
    { number: "500+", label: "Traditional Recipes" },
    { number: "50+", label: "Partner Caterers" },
    { number: "25+", label: "Countries Served" },
  ]

  const router = useRouter()

  return (
    <div className="min-h-screen">
      <div className="flex items-center gap-2 mb-8">
        <Button variant="back" onClick={() => router.back()} className="p-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-semibold">About Us</h1>
      </div>

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-r from-orange-50 to-red-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Our Story: From Village Kitchens to Global Tables</h1>
            <p className="text-xl text-gray-700 leading-relaxed">
              Catering was born from a simple belief: that the most authentic and delicious Indian food comes from the
              heart of rural communities, where recipes have been passed down through generations.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
              <p className="text-lg text-gray-700 mb-6">
                We exist to bridge the gap between authentic rural Indian cuisine and the global community. Our platform
                empowers local caterers and traditional cooks to share their culinary heritage while providing food
                enthusiasts worldwide access to genuine, home-style Indian meals.
              </p>
              <p className="text-lg text-gray-700">
                Every order supports rural communities, preserves traditional cooking methods, and brings families
                together over authentic flavors that tell the story of India's rich culinary landscape.
              </p>
            </div>
            <div>
              <Image
                src="https://images.unsplash.com/photo-1589778655375-3e622a9fc91c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fHJ1cnFhbCUyMHJhamF0aGFuaSUyMGZvb2R8ZW58MHx8MHx8fDA%3D"
                alt="Traditional Indian cooking"
                width={600}
                height={400}
                className="rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="text-center h-full">
                <CardHeader>
                  <div className="flex justify-center mb-4">{value.icon}</div>
                  <CardTitle className="text-xl">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{value.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Impact</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2">{stat.number}</div>
                <div className="text-lg opacity-90">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Meet Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <Image
                    src={member.image || "/placeholder.svg"}
                    alt={member.name}
                    width={300}
                    height={300}
                    className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                  />
                  <CardTitle className="text-xl">{member.name}</CardTitle>
                  <Badge variant="secondary">{member.role}</Badge>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{member.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How We Work</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <Utensils className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Source Authentically</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  We partner directly with rural caterers and traditional cooks who have mastered time-honored recipes
                  passed down through generations.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Award className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Ensure Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Every dish is prepared with the finest ingredients and traditional methods, maintaining the authentic
                  taste and nutritional value.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Truck className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Deliver Fresh</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Our efficient logistics network ensures your meals arrive fresh and ready to enjoy, bringing the
                  warmth of Indian hospitality to your table.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-primary text-primary-foreground text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-6">Join Our Culinary Journey</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Experience the authentic flavors of rural India and support traditional communities with every delicious
            bite.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/menu"
              className="bg-primary-foreground text-primary px-8 py-3 rounded-lg font-semibold hover:bg-primary-foreground/90 transition-colors"
            >
              Explore Our Menu
            </a>
            <a
              href="/contact"
              className="border-2 border-primary-foreground text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary-foreground hover:text-primary transition-colors"
            >
              Get in Touch
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
