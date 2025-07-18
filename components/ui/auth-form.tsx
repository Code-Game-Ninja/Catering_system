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
  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [resetMessage, setResetMessage] = useState<string | null>(null)
  const router = useRouter()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isRegister) {
        if (password !== confirmPassword) {
          setError("Passwords do not match.")
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
        setError(null)
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
        setError(null)
        router.push(onSuccessRedirect)
      }
    } catch (err: any) {
      log("error", `Authentication failed (${isRegister ? "register" : "login"})`, { error: err.message })
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetMessage(null)
    try {
      await sendPasswordResetEmail(auth, resetEmail)
      setResetMessage("Password reset email sent! Check your inbox.")
    } catch (err: any) {
      setResetMessage(err.message)
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
        {showReset ? (
          <form onSubmit={handlePasswordReset} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="m@example.com"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
            </div>
            {resetMessage && <p className="text-sm text-center text-green-600 dark:text-green-400">{resetMessage}</p>}
            <Button type="submit" className="w-full">Send Password Reset Email</Button>
            <Button type="button" variant="link" className="w-full" onClick={() => setShowReset(false)}>
              Back to Login
            </Button>
          </form>
        ) : (
          <>
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
            <Button type="button" variant="link" className="w-full mt-2" onClick={() => setShowReset(true)}>
              Forgot password?
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
