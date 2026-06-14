"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Check, Eye, EyeOff, Lock, Loader2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { TwoFactorAuth } from "@/components/security/two-factor-auth"

export default function SecurityPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [updating, setUpdating] = useState(false)
  const [signingOutOthers, setSigningOutOthers] = useState(false)

  const supabase = createClient()

  const handleSignOutOthers = async () => {
    setSigningOutOthers(true)
    try {
      const { error } = await supabase.auth.signOut({ scope: "others" })
      if (error) throw error
      toast.success("Signed out of all other sessions")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to sign out other sessions"
      toast.error(message)
    } finally {
      setSigningOutOthers(false)
    }
  }

  // Mock login history
  const loginHistory = [
    { date: "2023-11-20 14:30:25", ip: "192.168.1.1", location: "Los Angeles, CA", device: "Chrome on Windows" },
    { date: "2023-11-18 09:15:10", ip: "192.168.1.1", location: "Los Angeles, CA", device: "Safari on iPhone" },
    { date: "2023-11-15 16:45:33", ip: "192.168.1.1", location: "Los Angeles, CA", device: "Chrome on Windows" },
    { date: "2023-11-10 11:20:45", ip: "192.168.1.1", location: "San Francisco, CA", device: "Firefox on MacOS" },
    { date: "2023-11-05 08:05:12", ip: "192.168.1.1", location: "Los Angeles, CA", device: "Chrome on Windows" },
  ]

  const calculatePasswordStrength = (password: string) => {
    if (!password) return 0

    let strength = 0

    // Length check
    if (password.length >= 8) strength += 20

    // Contains lowercase
    if (/[a-z]/.test(password)) strength += 20

    // Contains uppercase
    if (/[A-Z]/.test(password)) strength += 20

    // Contains number
    if (/[0-9]/.test(password)) strength += 20

    // Contains special character
    if (/[^A-Za-z0-9]/.test(password)) strength += 20

    return strength
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value
    setPassword(newPassword)
    setPasswordStrength(calculatePasswordStrength(newPassword))
  }

  const getStrengthColor = () => {
    if (passwordStrength < 40) return "bg-red-500"
    if (passwordStrength < 80) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getStrengthText = () => {
    if (passwordStrength < 40) return "Weak"
    if (passwordStrength < 80) return "Medium"
    return "Strong"
  }

  const handlePasswordUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!currentPassword) {
      toast.error('Please enter your current password')
      return
    }
    
    if (!password) {
      toast.error('Please enter a new password')
      return
    }
    
    if (password !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    
    if (passwordStrength < 60) {
      toast.error('Password is too weak. Please choose a stronger password.')
      return
    }

    try {
      setUpdating(true)
      
      // First, verify the current password by attempting to sign in
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) {
        throw new Error('No user found')
      }
      
      // Attempt to verify current password by signing in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      })
      
      if (signInError) {
        throw new Error('Current password is incorrect')
      }
      
      // Now update the password
      const { error } = await supabase.auth.updateUser({
        password: password
      })
      
      if (error) throw error
      
      // Reset form fields
      setCurrentPassword('')
      setPassword('')
      setConfirmPassword('')
      setPasswordStrength(0)
      
      toast.success('Password updated successfully!')
    } catch (error: any) {
      console.error('Error updating password:', error)
      toast.error(error.message || 'Failed to update password')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Security</h1>
        <p className="text-muted-foreground">Manage your account security settings</p>
      </div>

      <Tabs defaultValue="password" className="space-y-6">
        <TabsList>
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="2fa">Two-Factor Authentication</TabsTrigger>
          <TabsTrigger value="sessions">Login History</TabsTrigger>
        </TabsList>

        <TabsContent value="password" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <form onSubmit={handlePasswordUpdate}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      name="current-password"
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      name="new-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={handlePasswordChange}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                {password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Password Strength: {getStrengthText()}</span>
                      <span className="text-sm">{passwordStrength}%</span>
                    </div>
                    <Progress value={passwordStrength} className={getStrengthColor()} />
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <li className="flex items-center">
                        <span className={`mr-2 text-${password.length >= 8 ? "green" : "red"}-500`}>
                          {password.length >= 8 ? <Check size={12} /> : <AlertCircle size={12} />}
                        </span>
                        At least 8 characters
                      </li>
                      <li className="flex items-center">
                        <span className={`mr-2 text-${/[A-Z]/.test(password) ? "green" : "red"}-500`}>
                          {/[A-Z]/.test(password) ? <Check size={12} /> : <AlertCircle size={12} />}
                        </span>
                        At least one uppercase letter
                      </li>
                      <li className="flex items-center">
                        <span className={`mr-2 text-${/[a-z]/.test(password) ? "green" : "red"}-500`}>
                          {/[a-z]/.test(password) ? <Check size={12} /> : <AlertCircle size={12} />}
                        </span>
                        At least one lowercase letter
                      </li>
                      <li className="flex items-center">
                        <span className={`mr-2 text-${/[0-9]/.test(password) ? "green" : "red"}-500`}>
                          {/[0-9]/.test(password) ? <Check size={12} /> : <AlertCircle size={12} />}
                        </span>
                        At least one number
                      </li>
                      <li className="flex items-center">
                        <span className={`mr-2 text-${/[^A-Za-z0-9]/.test(password) ? "green" : "red"}-500`}>
                          {/[^A-Za-z0-9]/.test(password) ? <Check size={12} /> : <AlertCircle size={12} />}
                        </span>
                        At least one special character
                      </li>
                    </ul>
                  </div>
                )}
              </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input 
                    id="confirm-password" 
                    name="confirm-password"
                    type="password" 
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  {confirmPassword && password && confirmPassword !== password && (
                    <p className="text-sm text-red-500">Passwords do not match</p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  disabled={updating || !currentPassword || !password || !confirmPassword || password !== confirmPassword || passwordStrength < 60}
                >
                  {updating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="2fa" className="space-y-6">
          <TwoFactorAuth />
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Login History</CardTitle>
              <CardDescription>Recent login activity on your account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loginHistory.map((session, index) => (
                  <div key={index} className="flex items-start space-x-4 rounded-md border p-4">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Lock className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="font-medium">{session.device}</p>
                      <div className="text-sm text-muted-foreground">
                        <p>IP: {session.ip}</p>
                        <p>Location: {session.location}</p>
                        <p>Date: {session.date}</p>
                      </div>
                    </div>
                    {index === 0 && (
                      <div className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-800/30 dark:text-green-500">
                        Current
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={handleSignOutOthers} disabled={signingOutOthers}>
                {signingOutOthers && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign Out All Other Sessions
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
