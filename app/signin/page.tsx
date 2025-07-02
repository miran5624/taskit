"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Eye, EyeOff, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAppDispatch, useAppSelector } from "@/lib/hooks"
import { loginUser, clearError } from "@/lib/store"

export default function SignInPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const dispatch = useAppDispatch()
  const { loading, error } = useAppSelector((state) => state.app)
  const router = useRouter()

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Clear any previous errors
    dispatch(clearError())

    if (!validateForm()) return

    try {
      await dispatch(
        loginUser({
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        }),
      ).unwrap()

      // Success - redirect to dashboard
      router.push("/dashboard")
    } catch (err) {
      // Error is handled by Redux and displayed in the UI
      console.error("Login failed:", err)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })

    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" })
    }

    // Clear global error when user makes changes
    if (error) {
      dispatch(clearError())
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#181818]">
      <div className="absolute left-4 top-4">
        <Button variant="ghost" onClick={() => router.push("/")}>← Back to Home</Button>
      </div>
      <div className="w-full max-w-md p-8 rounded-2xl bg-[#111111]">
        <div className="flex flex-col items-center mb-8">
          <span className="text-4xl font-extrabold text-white mb-2">TaskIt</span>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="email" className="block text-white mb-1">Email</label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className="w-full rounded-md bg-black text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1de9b6]"
              disabled={loading}
            />
            {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="block text-white mb-1">Password</label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className="w-full rounded-md bg-black text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1de9b6] pr-10"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                disabled={loading}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
          </div>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                className="accent-[#1de9b6] mr-2"
                disabled={loading}
              />
              <label htmlFor="remember" className="text-white text-sm">Remember me</label>
            </div>
            <Link href="#" className="text-[#1de9b6] text-sm">Forgot your password?</Link>
          </div>

          <Button
            type="submit"
            className="w-full py-3 rounded-full bg-[#1de9b6] text-black font-bold text-lg tracking-wide hover:bg-[#13c8a3] transition"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className="text-center mt-6">
          <p className="text-gray-400 text-sm">
            Don't have an account?{" "}
            <Link href="/signup" className="text-[#3ecf8e] hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
