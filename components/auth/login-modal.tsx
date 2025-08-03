"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Mail, Lock, AlertCircle, Loader2 } from "lucide-react"
import { GoogleIcon } from "@/components/icons/google-icon"

interface LoginModalProps {
  children: React.ReactNode
  onLoginSuccess?: (user: any) => void
}

interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}

interface LoginError {
  type: "email" | "password" | "general" | "google"
  message: string
}

export function LoginModal({ children, onLoginSuccess }: LoginModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
    rememberMe: false,
  })
  const [errors, setErrors] = useState<LoginError[]>([])
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const router = useRouter()

  // Clear errors when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setErrors([])
      setFormData({ email: "", password: "", rememberMe: false })
      setShowPassword(false)
    }
  }, [isOpen])

  // Handle form input changes
  const handleInputChange = (field: keyof LoginFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear field-specific errors when user starts typing
    if (typeof value === "string" && value.length > 0) {
      setErrors((prev) => prev.filter((error) => error.type !== field))
    }
  }

  // Validate form inputs
  const validateForm = (): boolean => {
    const newErrors: LoginError[] = []

    // Email validation
    if (!formData.email.trim()) {
      newErrors.push({ type: "email", message: "Email is required" })
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.push({ type: "email", message: "Please enter a valid email address" })
    }

    // Password validation
    if (!formData.password) {
      newErrors.push({ type: "password", message: "Password is required" })
    } else if (formData.password.length < 6) {
      newErrors.push({ type: "password", message: "Password must be at least 6 characters" })
    }

    setErrors(newErrors)
    return newErrors.length === 0
  }

  // Handle email/password login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    setErrors([])

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // TODO: Replace with actual authentication API call
      // For testing purposes, accept any email/password combination
      console.log("🔐 [DEV MODE] Login attempt:", {
        email: formData.email,
        password: "***hidden***",
        rememberMe: formData.rememberMe,
      })

      // Simulate successful login
      const mockUser = {
        id: "user_123",
        email: formData.email,
        name: formData.email.split("@")[0],
        avatar: null,
        loginMethod: "email",
      }

      // Store user session (in production, this would be handled by your auth provider)
      if (formData.rememberMe) {
        localStorage.setItem("yls_user", JSON.stringify(mockUser))
      } else {
        sessionStorage.setItem("yls_user", JSON.stringify(mockUser))
      }

      // Call success callback
      onLoginSuccess?.(mockUser)

      // Close modal and redirect
      setIsOpen(false)
      router.push("/dashboard")
    } catch (error) {
      console.error("Login error:", error)
      setErrors([
        {
          type: "general",
          message: "Login failed. Please check your credentials and try again.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Google 1-Click Login
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    setErrors([])

    try {
      // TODO: Implement actual Google OAuth integration
      // This is a placeholder for Google 1-Click Login
      console.log("🔐 [DEV MODE] Google login initiated")

      // Simulate Google OAuth flow
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Simulate successful Google login
      const mockGoogleUser = {
        id: "google_user_456",
        email: "user@gmail.com",
        name: "John Doe",
        avatar: "https://lh3.googleusercontent.com/a/default-user=s96-c",
        loginMethod: "google",
      }

      // Store user session
      localStorage.setItem("yls_user", JSON.stringify(mockGoogleUser))

      // Call success callback
      onLoginSuccess?.(mockGoogleUser)

      // Close modal and redirect
      setIsOpen(false)
      router.push("/dashboard")
    } catch (error) {
      console.error("Google login error:", error)
      setErrors([
        {
          type: "google",
          message: "Google login failed. Please try again.",
        },
      ])
    } finally {
      setIsGoogleLoading(false)
    }
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false)
    }
  }

  // Get error message for specific field
  const getFieldError = (field: string) => {
    return errors.find((error) => error.type === field)?.message
  }

  // Get general error messages
  const getGeneralErrors = () => {
    return errors.filter((error) => error.type === "general" || error.type === "google")
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md w-full mx-4" onKeyDown={handleKeyDown} aria-describedby="login-description">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-bold text-center text-gray-900 dark:text-gray-50">
            Welcome Back
          </DialogTitle>
          <DialogDescription id="login-description" className="text-center text-gray-600 dark:text-gray-400">
            Sign in to your Yellow Letter Shop account to continue
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* General Error Messages */}
          {getGeneralErrors().map((error, index) => (
            <Alert key={index} variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-950/20">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          ))}

          {/* Google Login Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 text-gray-700 border-gray-300 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-800 bg-transparent"
            onClick={handleGoogleLogin}
            disabled={isLoading || isGoogleLoading}
            aria-label="Sign in with Google"
          >
            {isGoogleLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <GoogleIcon className="mr-2 h-5 w-5" />
            )}
            {isGoogleLoading ? "Signing in..." : "Continue with Google"}
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4" noValidate>
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`pl-10 h-12 ${
                    getFieldError("email")
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-yellow-500 focus:ring-yellow-500"
                  }`}
                  disabled={isLoading}
                  aria-invalid={!!getFieldError("email")}
                  aria-describedby={getFieldError("email") ? "email-error" : undefined}
                  autoComplete="email"
                  required
                />
              </div>
              {getFieldError("email") && (
                <p id="email-error" className="text-sm text-red-600 dark:text-red-400" role="alert">
                  {getFieldError("email")}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className={`pl-10 pr-10 h-12 ${
                    getFieldError("password")
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-yellow-500 focus:ring-yellow-500"
                  }`}
                  disabled={isLoading}
                  aria-invalid={!!getFieldError("password")}
                  aria-describedby={getFieldError("password") ? "password-error" : undefined}
                  autoComplete="current-password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
              {getFieldError("password") && (
                <p id="password-error" className="text-sm text-red-600 dark:text-red-400" role="alert">
                  {getFieldError("password")}
                </p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember-me"
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) => handleInputChange("rememberMe", checked as boolean)}
                  disabled={isLoading}
                  className="border-gray-300 data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500"
                />
                <Label htmlFor="remember-me" className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                  Remember me
                </Label>
              </div>
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto text-sm text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300"
                disabled={isLoading}
              >
                Forgot password?
              </Button>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              className="w-full h-12 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold"
              disabled={isLoading || isGoogleLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{" "}
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto text-sm text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300 font-semibold"
              >
                Create Account
              </Button>
            </p>
          </div>

          {/* Development Notice */}
          <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              <strong>Development Mode:</strong> Any email/password combination will work for testing purposes.
            </AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  )
}
