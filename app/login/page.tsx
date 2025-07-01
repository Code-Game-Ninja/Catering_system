"use client"

import { useState } from "react"
import { AuthForm } from "@/components/ui/auth-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function LoginPage() {
  const [showRegister, setShowRegister] = useState(false)
  const [registrationType, setRegistrationType] = useState<"user" | "restaurant_owner">("user")

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-950">
      {showRegister ? (
        <div className="flex flex-col items-center gap-4">
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
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <Card className="w-full max-w-md bg-white rounded-xl shadow-lg">
            <CardContent className="pt-6">
              <AuthForm />
              <Button variant="link" className="w-full" onClick={() => setShowRegister(true)}>
                Don't have an account? Register
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
