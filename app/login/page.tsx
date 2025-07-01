"use client"

import { useState } from "react"
import { AuthForm } from "@/components/ui/auth-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function LoginPage() {
  const [showRegister, setShowRegister] = useState(false)
  const [registrationType, setRegistrationType] = useState<"user" | "restaurant_owner">("user")

  return (
    <div className="relative flex min-h-[calc(100vh-64px)] items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-950">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1581455988162-f6040daa6923?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8TG9naW4lMjB3aXRoJTIwZm9vZHxlbnwwfHwwfHx8MA%3D%3D')] bg-cover bg-center opacity-40 z-0" />
      <div className="relative z-10 w-full flex flex-col items-center gap-4">
        {showRegister ? (
          <Card className="w-full max-w-md bg-white rounded-xl shadow-lg">
            <CardContent className="pt-6">
              <div className="flex justify-center gap-4 mb-6">
                <Button
                  variant={registrationType === "user" ? "default" : "outline"}
                  onClick={() => setRegistrationType("user")}
                >
                  Register as User
                </Button>
                <Button
                  variant={registrationType === "restaurant_owner" ? "default" : "outline"}
                  onClick={() => setRegistrationType("restaurant_owner")}
                >
                  Register as Restaurant Owner
                </Button>
              </div>
              <AuthForm
                isRegister
                defaultRole={registrationType}
                onSuccessRedirect={registrationType === "restaurant_owner" ? "/restaurant-owner/setup" : "/"}
              />
              <Button variant="link" className="w-full mt-4" onClick={() => setShowRegister(false)}>
                Already have an account? Login
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full max-w-md bg-white rounded-xl shadow-lg">
            <CardContent className="pt-6">
              <AuthForm />
              <Button variant="link" className="w-full" onClick={() => setShowRegister(true)}>
                Don't have an account? Register
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
