"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail } from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { log } from "@/lib/logging"
import type { UserRole } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast" // Import useToast

interface AuthFormProps {
  isRegister?: boolean
  defaultRole?: UserRole
  onSuccessRedirect?: string
}

export function AuthForm({ isRegister = false, defaultRole = "user", onSuccessRedirect = "/" }: AuthFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast() // Initialize toast

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isRegister) {
        if (password !== confirmPassword) {
          setError("Passwords do not match.")
          toast({
            title: "Registration Failed",
            description: "Passwords do not match.",
            variant: "destructive",
          })
          setLoading(false)
          return
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        const user = userCredential.user

        const userDocRef = doc(db, "users", user.uid)
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          role: defaultRole,
          isVerified: false,
          createdAt: new Date(),
        })
        log("info", "User registered successfully", { uid: user.uid, email: user.email, role: defaultRole })
        toast({
          title: "Registration Successful!",
          description: "Your account has been created.",
          variant: "default",
        })
        await sendEmailVerification(user)
        router.push(onSuccessRedirect)
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        const user = userCredential.user

        const userDocRef = doc(db, "users", user.uid)
        const userDocSnap = await getDoc(userDocRef)

        if (!userDocSnap.exists()) {
          await setDoc(userDocRef, {
            uid: user.uid,
            email: user.email ?? "",
            role: "user",
            isVerified: false,
            createdAt: new Date(),
          })
          log("info", "Basic user profile created on login", { uid: user.uid })
        } else {
          log("info", "User logged in successfully", { uid: user.uid })
        }
        toast({
          title: "Login Successful!",
          description: "You have been logged in.",
          variant: "default",
        })
        router.push(onSuccessRedirect)
      }
    } catch (err: any) {
      log("error", `Authentication failed (${isRegister ? "register" : "login"})`, { error: err.message })
      setError(err.message)
      toast({
        title: "Authentication Failed",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">{isRegister ? "Register" : "Login"}</CardTitle>
        <CardDescription>
          {isRegister ? "Create your account" : "Enter your email below to login to your account"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAuth} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {isRegister && (
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <LoadingSpinner /> : isRegister ? "Register" : "Login"}
          </Button>
        </form>
        {/* Add a 'Forgot password?' link below the login form */}
        {/* When clicked, show an inline form to enter email and sendPasswordResetEmail */}
        {/* Show success/error messages */}
      </CardContent>
    </Card>
  )
}
