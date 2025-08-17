"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GoogleIcon } from "@/components/icons/google-icon"
import { Mail, Lock, AlertCircle, Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

// Centralized modal that reacts to the `?auth=` query param across the app
// Supported values: login, signup, forgot, reset, verify, change

type AuthMode = "login" | "signup" | "forgot" | "reset" | "verify" | "change"

export function AuthFlowModalController() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const authParam = (searchParams.get("auth") || "") as AuthMode | ""
  const redirectedFrom = searchParams.get("redirectedFrom") || undefined

  const [isOpen, setIsOpen] = useState<boolean>(!!authParam)
  const [mode, setMode] = useState<AuthMode>((authParam as AuthMode) || "login")

  // Shared state
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  // Login state
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)

  // Signup state
  const [signupEmail, setSignupEmail] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [agree, setAgree] = useState(false)

  // Reset/Change state
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  // Forgot state
  const [forgotEmail, setForgotEmail] = useState("")

  // Keep modal in sync with query param
  useEffect(() => {
    const incoming = (searchParams.get("auth") || "") as AuthMode | ""
    if (incoming) {
      setMode((incoming as AuthMode) || "login")
      if (!isOpen) setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }, [searchParams])

  // Clean up query when modal closes
  useEffect(() => {
    if (!isOpen && searchParams.get("auth")) {
      const url = new URL(window.location.href)
      url.searchParams.delete("auth")
      url.searchParams.delete("redirectedFrom")
      router.replace(url.pathname + (url.search ? url.search : "") + url.hash, { scroll: false })
    }
  }, [isOpen])

  const title = useMemo(() => {
    switch (mode) {
      case "signup":
        return "Create your account"
      case "forgot":
        return "Forgot password"
      case "reset":
        return "Set a new password"
      case "verify":
        return "Email verified"
      case "change":
        return "Change password"
      default:
        return "Welcome Back"
    }
  }, [mode])

  const description = useMemo(() => {
    switch (mode) {
      case "signup":
        return "Start using Yellow Letter Shop"
      case "forgot":
        return "Enter your email and we'll send a reset link"
      case "reset":
        return "Enter and confirm your new password"
      case "verify":
        return "You're good to go. Sign in to continue."
      case "change":
        return "Update your password"
      default:
        return "Sign in to your Yellow Letter Shop account to continue"
    }
  }, [mode])

  const destAfterAuth = (redirectedFrom && redirectedFrom.startsWith("/")) ? redirectedFrom : "/dashboard"

  // Actions
  const loginWithEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword })
      if (error) {
        setError(error.message || "Login failed. Please check your credentials and try again.")
        return
      }
      setIsOpen(false)
      router.push(destAfterAuth)
    } catch (err) {
      console.error(err)
      setError("Login failed. Please check your credentials and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const loginWithGoogle = async () => {
    setError(null)
    setIsGoogleLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}${destAfterAuth}` },
      })
      if (error) setError(error.message || "Google login failed. Please try again.")
    } catch (err) {
      console.error(err)
      setError("Google login failed. Please try again.")
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    if (!agree) {
      setError("Please accept the Terms to continue.")
      return
    }
    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: { emailRedirectTo: `${window.location.origin}/?auth=verify` },
      })
      if (error) {
        setError(error.message || "Sign up failed. Please try again.")
        return
      }
      if (data.session) {
        router.push("/dashboard")
      } else {
        setMessage("Check your email for a confirmation link to complete your registration.")
      }
    } catch (err) {
      console.error(err)
      setError("Unexpected error during sign up. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const sendReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/?auth=reset`,
      })
      if (error) {
        setError(error.message || "Failed to send reset link. Please try again.")
        return
      }
      setMessage(`If an account exists for ${forgotEmail}, a reset link has been sent.`)
    } catch (err) {
      console.error(err)
      setError("Unexpected error sending reset link. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        setError(error.message || "Failed to update password. Please try again.")
        return
      }
      setMessage("Password updated. You can now sign in with your new password.")
      setTimeout(() => {
        // Switch to login mode and clean up query
        const url = new URL(window.location.href)
        url.searchParams.set("auth", "login")
        router.replace(url.pathname + "?" + url.searchParams.toString(), { scroll: false })
      }, 1200)
    } catch (err) {
      console.error(err)
      setError("Unexpected error updating password. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // If user lands on verify link and is already authenticated, move on
  useEffect(() => {
    const checkVerified = async () => {
      if (mode !== "verify") return
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          router.replace(destAfterAuth)
        }
      } catch {}
    }
    checkVerified()
  }, [mode])

  // Exchange code for session on landing (email confirm or password recovery links)
  useEffect(() => {
    const run = async () => {
      try {
        const url = new URL(window.location.href)
        const hasCode = !!url.searchParams.get("code")
        const hasHashToken = !!url.hash && (url.hash.includes("access_token") || url.hash.includes("refresh_token"))
        if (hasCode) {
          const code = url.searchParams.get("code") as string
          await supabase.auth.exchangeCodeForSession(code)
          // Remove sensitive params after exchange but keep auth + redirectedFrom
          const clean = new URL(window.location.href)
          clean.searchParams.delete("code")
          clean.searchParams.delete("type")
          router.replace(clean.pathname + (clean.search ? clean.search : "") + (clean.hash || ""), { scroll: false })
        } else if (hasHashToken) {
          const { data } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
              const clean = new URL(window.location.href)
              clean.hash = ""
              router.replace(clean.pathname + (clean.search ? clean.search : ""), { scroll: false })
              data.subscription.unsubscribe()
            }
          })
        }
      } catch (e) {
        // no-op; user may still proceed to login
      }
    }
    run()
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md w-full mx-4" aria-describedby="auth-description">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-bold text-center">{title}</DialogTitle>
          <DialogDescription id="auth-description" className="text-center">
            {description}
          </DialogDescription>
        </DialogHeader>

        {/* Status messages */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {message && (
          <Alert className="mb-4">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {/* LOGIN */}
        {mode === "login" && (
          <div className="space-y-6 py-2">
            <Button
              type="button"
              variant="outline"
              className="w-full h-12"
              onClick={loginWithGoogle}
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

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={loginWithEmail} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="login-email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input id="login-email" type="email" placeholder="Enter your email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} autoComplete="email" required className="pl-10 h-12" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input id="login-password" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} autoComplete="current-password" required className="pl-10 pr-10 h-12" />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember-me" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(!!checked)} />
                  <Label htmlFor="remember-me" className="text-sm">Remember me</Label>
                </div>
                <Button type="button" variant="link" className="p-0 h-auto text-sm" onClick={() => {
                  const url = new URL(window.location.href)
                  url.searchParams.set("auth", "forgot")
                  router.replace(url.pathname + "?" + url.searchParams.toString(), { scroll: false })
                }}>Forgot password?</Button>
              </div>

              <Button type="submit" className="w-full h-12" disabled={isLoading || isGoogleLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</> : "Sign In"}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-sm">
                Don't have an account? {""}
                <Button type="button" variant="link" className="p-0 h-auto text-sm font-semibold" onClick={() => {
                  const url = new URL(window.location.href)
                  url.searchParams.set("auth", "signup")
                  router.replace(url.pathname + "?" + url.searchParams.toString(), { scroll: false })
                }}>Create Account</Button>
              </p>
            </div>
          </div>
        )}

        {/* SIGNUP */}
        {mode === "signup" && (
          <form onSubmit={signUp} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input id="signup-email" type="email" placeholder="Email" className="pl-10" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} required autoComplete="email" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">Password (min 6 characters)</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input id="signup-password" type={showPassword ? "text" : "password"} placeholder="Password" className="pl-10 pr-10" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} required minLength={6} autoComplete="new-password" />
                <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="agree" checked={agree} onCheckedChange={(v) => setAgree(!!v)} />
              <label htmlFor="agree" className="text-sm">I agree to the Terms and Privacy Policy</label>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...</> : "Create Account"}
            </Button>
            <div className="text-center">
              <Button type="button" variant="link" className="p-0 h-auto text-sm" onClick={() => {
                const url = new URL(window.location.href)
                url.searchParams.set("auth", "login")
                router.replace(url.pathname + "?" + url.searchParams.toString(), { scroll: false })
              }}>Back to sign in</Button>
            </div>
          </form>
        )}

        {/* FORGOT PASSWORD */}
        {mode === "forgot" && (
          <form onSubmit={sendReset} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input id="forgot-email" type="email" placeholder="Email" className="pl-10" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required autoComplete="email" />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : "Send Reset Link"}
            </Button>
            <div className="text-center">
              <Button type="button" variant="link" className="p-0 h-auto text-sm" onClick={() => {
                const url = new URL(window.location.href)
                url.searchParams.set("auth", "login")
                router.replace(url.pathname + "?" + url.searchParams.toString(), { scroll: false })
              }}>Back to sign in</Button>
            </div>
          </form>
        )}

        {/* RESET or CHANGE PASSWORD */}
        {(mode === "reset" || mode === "change") && (
          <form onSubmit={updatePassword} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input id="new-password" type={showPassword ? "text" : "password"} placeholder="Enter a new password" className="pl-10 pr-10" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
                <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input id="confirm-password" type={showPassword ? "text" : "password"} placeholder="Confirm your new password" className="pl-10 pr-10" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</> : "Update Password"}
            </Button>
            <div className="text-center">
              <Button type="button" variant="link" className="p-0 h-auto text-sm" onClick={() => {
                const url = new URL(window.location.href)
                url.searchParams.set("auth", "login")
                router.replace(url.pathname + "?" + url.searchParams.toString(), { scroll: false })
              }}>Back to sign in</Button>
            </div>
          </form>
        )}

        {/* VERIFY */}
        {mode === "verify" && (
          <div className="space-y-4 py-2">
            <Alert>
              <AlertDescription className="flex items-center">
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" /> Your email has been verified.
              </AlertDescription>
            </Alert>
            <Button className="w-full" onClick={() => {
              const url = new URL(window.location.href)
              url.searchParams.set("auth", "login")
              router.replace(url.pathname + "?" + url.searchParams.toString(), { scroll: false })
            }}>Sign in</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
