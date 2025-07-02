"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Eye, EyeOff, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useAppDispatch, useAppSelector } from "@/lib/hooks"
import { registerUser, clearError } from "@/lib/store"

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email") || "";
  const [formData, setFormData] = useState({
    email: emailFromQuery,
    password: "",
    confirmPassword: "",
    teamName: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const dispatch = useAppDispatch()
  const { loading, error } = useAppSelector((state) => state.app)
  const router = useRouter()

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long"
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    // Team name validation (optional but if provided, must be valid)
    if (formData.teamName && (formData.teamName.length < 1 || formData.teamName.length > 100)) {
      newErrors.teamName = "Team name must be between 1 and 100 characters"
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
        registerUser({
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          teamName: formData.teamName.trim() || undefined,
        }),
      ).unwrap()

      // Success - redirect to dashboard
      router.push("/dashboard")
    } catch (err) {
      // Error is handled by Redux and displayed in the UI
      console.error("Registration failed:", err)
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
        <Button variant="ghost" onClick={() => router.push("/")}>
          ← Back to Home
        </Button>
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
            <input
              id="email"
              type="email"
              className="w-full rounded-md bg-black text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1de9b6]"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
            />
            {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="block text-white mb-1">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="w-full rounded-md bg-black text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1de9b6] pr-10"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#1de9b6]"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-[#1de9b6] text-sm"
            >
              Forgot your password?
            </button>
            {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
          </div>

          <div className="mb-4">
            <label htmlFor="confirmPassword" className="block text-white mb-1">Confirm Password</label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                className="w-full rounded-md bg-black text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1de9b6] pr-10"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#1de9b6]"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>}
          </div>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <input id="remember" type="checkbox" className="accent-[#1de9b6] mr-2" />
              <label htmlFor="remember" className="text-white text-sm">Remember me</label>
            </div>
            <a href="#" className="text-[#1de9b6] text-sm">Forgot your password?</a>
          </div>

          <Button
            type="submit"
            className="w-full py-3 rounded-full bg-[#1de9b6] text-black font-bold text-lg tracking-wide hover:bg-[#13c8a3] transition"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <div className="text-center mt-4">
          <p className="text-gray-400 text-sm">
            Already have an account?{" "}
            <Link href="/signin" className="text-[#3ecf8e] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
