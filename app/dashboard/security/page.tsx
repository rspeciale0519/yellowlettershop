"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { AlertCircle, Check, Copy, Eye, EyeOff, Lock, RefreshCw, Shield, Smartphone } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function SecurityPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false)
  const [showQRCode, setShowQRCode] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")

  // Mock recovery codes
  const recoveryCodes = [
    "ABCD-EFGH-IJKL-MNOP",
    "QRST-UVWX-YZ12-3456",
    "7890-ABCD-EFGH-IJKL",
    "MNOP-QRST-UVWX-YZ12",
    "3456-7890-ABCD-EFGH",
    "IJKL-MNOP-QRST-UVWX",
    "YZ12-3456-7890-ABCD",
    "EFGH-IJKL-MNOP-QRST",
  ]

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
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="••••••••"
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
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={handlePasswordChange}
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
                <Input id="confirm-password" type="password" placeholder="••••••••" />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Update Password</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="2fa" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="2fa-toggle">Enable Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Require a verification code when signing in</p>
                </div>
                <Switch
                  id="2fa-toggle"
                  checked={twoFactorEnabled}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setShowQRCode(true)
                    } else {
                      setTwoFactorEnabled(false)
                    }
                  }}
                />
              </div>

              {twoFactorEnabled && (
                <>
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertTitle>Two-factor authentication is enabled</AlertTitle>
                    <AlertDescription>
                      Your account is now more secure. You'll need to enter a verification code when signing in.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label>Recovery Codes</Label>
                    <p className="text-sm text-muted-foreground">
                      Save these recovery codes in a secure place. You can use them to access your account if you lose
                      your authentication device.
                    </p>
                    <div className="relative mt-2 rounded-md border p-4">
                      {showRecoveryCodes ? (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {recoveryCodes.map((code, index) => (
                            <div key={index} className="font-mono text-sm">
                              {code}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Recovery codes are hidden for security</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => setShowRecoveryCodes(true)}
                          >
                            Show Recovery Codes
                          </Button>
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2"
                        onClick={() => {
                          // In a real app, this would copy the codes to clipboard
                          alert("Recovery codes copied to clipboard")
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button variant="outline" onClick={() => setShowQRCode(true)}>
                      <Smartphone className="mr-2 h-4 w-4" />
                      Set Up New Device
                    </Button>
                    <Button variant="outline">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Generate New Recovery Codes
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
                <DialogDescription>
                  Scan the QR code with your authenticator app and enter the verification code below.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center space-y-4">
                <div className="rounded-md border p-4">
                  <img src="/placeholder.svg?height=200&width=200" alt="QR Code" className="h-48 w-48" />
                </div>
                <p className="text-sm text-muted-foreground">Can't scan the QR code? Use this code instead:</p>
                <div className="flex items-center space-x-2">
                  <code className="rounded-md bg-muted px-2 py-1 font-mono text-sm">ABCD EFGH IJKL MNOP</code>
                  <Button variant="ghost" size="icon">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="w-full space-y-2">
                  <Label htmlFor="verification-code">Verification Code</Label>
                  <Input
                    id="verification-code"
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowQRCode(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setTwoFactorEnabled(true)
                    setShowQRCode(false)
                  }}
                  disabled={verificationCode.length !== 6}
                >
                  Verify
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
              <Button variant="outline">Sign Out All Other Sessions</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
