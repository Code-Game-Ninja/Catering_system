"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

export default function SupportPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" })
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setForm({ name: "", email: "", message: "" })
  }

  return (
    <div className="min-h-screen py-12 bg-white">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8">Support</h1>
        <div className="max-w-xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Contact Support</CardTitle>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="text-green-600 text-center py-8 font-semibold">Thank you! Your message has been sent.</div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    name="name"
                    placeholder="Your Name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                  <Input
                    name="email"
                    type="email"
                    placeholder="Your Email"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                  <Textarea
                    name="message"
                    placeholder="How can we help you?"
                    rows={5}
                    value={form.message}
                    onChange={handleChange}
                    required
                  />
                  <Button type="submit" className="w-full">Send Message</Button>
                </form>
              )}
              <div className="mt-6 text-sm text-gray-500">
                <div><b>Urgent?</b> Call us at <span className="text-gray-700">6375960815</span> or email <span className="text-gray-700">chiragmishra2511@gmail.com</span></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 