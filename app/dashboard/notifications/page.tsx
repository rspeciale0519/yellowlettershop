"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Save } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function NotificationsPage() {
  // Mock notification settings
  const [emailSettings, setEmailSettings] = useState({
    orderUpdates: true,
    orderShipped: true,
    orderDelivered: true,
    paymentProcessed: true,
    newTemplates: true,
    templateUpdates: false,
    securityAlerts: true,
    accountChanges: true,
    teamInvites: true,
    teamUpdates: false,
    marketingEmails: false,
    newsletterEmails: false,
    productUpdates: true,
    featureAnnouncements: true,
  })

  const [pushSettings, setPushSettings] = useState({
    orderUpdates: true,
    orderShipped: true,
    orderDelivered: true,
    paymentProcessed: true,
    newTemplates: false,
    templateUpdates: false,
    securityAlerts: true,
    accountChanges: true,
    teamInvites: true,
    teamUpdates: false,
  })

  const [smsSettings, setSmsSettings] = useState({
    orderShipped: true,
    orderDelivered: true,
    securityAlerts: true,
    accountChanges: false,
  })

  const [emailDigestFrequency, setEmailDigestFrequency] = useState("weekly")

  const toggleEmailSetting = (key: keyof typeof emailSettings) => {
    setEmailSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const togglePushSetting = (key: keyof typeof pushSettings) => {
    setPushSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const toggleSmsSetting = (key: keyof typeof smsSettings) => {
    setSmsSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notification Settings</h1>
        <p className="text-muted-foreground">Manage how you receive notifications</p>
      </div>

      <Tabs defaultValue="email" className="space-y-6">
        <TabsList>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="push">Push Notifications</TabsTrigger>
          <TabsTrigger value="sms">SMS</TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>Manage the emails you receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Order Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-order-updates">Order Updates</Label>
                      <p className="text-sm text-muted-foreground">Receive emails about your order status changes</p>
                    </div>
                    <Switch
                      id="email-order-updates"
                      checked={emailSettings.orderUpdates}
                      onCheckedChange={() => toggleEmailSetting("orderUpdates")}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-order-shipped">Order Shipped</Label>
                      <p className="text-sm text-muted-foreground">Receive an email when your order ships</p>
                    </div>
                    <Switch
                      id="email-order-shipped"
                      checked={emailSettings.orderShipped}
                      onCheckedChange={() => toggleEmailSetting("orderShipped")}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-order-delivered">Order Delivered</Label>
                      <p className="text-sm text-muted-foreground">Receive an email when your order is delivered</p>
                    </div>
                    <Switch
                      id="email-order-delivered"
                      checked={emailSettings.orderDelivered}
                      onCheckedChange={() => toggleEmailSetting("orderDelivered")}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-payment-processed">Payment Processed</Label>
                      <p className="text-sm text-muted-foreground">Receive an email when your payment is processed</p>
                    </div>
                    <Switch
                      id="email-payment-processed"
                      checked={emailSettings.paymentProcessed}
                      onCheckedChange={() => toggleEmailSetting("paymentProcessed")}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Template Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-new-templates">New Templates</Label>
                      <p className="text-sm text-muted-foreground">Receive emails about new templates</p>
                    </div>
                    <Switch
                      id="email-new-templates"
                      checked={emailSettings.newTemplates}
                      onCheckedChange={() => toggleEmailSetting("newTemplates")}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-template-updates">Template Updates</Label>
                      <p className="text-sm text-muted-foreground">Receive emails when your templates are updated</p>
                    </div>
                    <Switch
                      id="email-template-updates"
                      checked={emailSettings.templateUpdates}
                      onCheckedChange={() => toggleEmailSetting("templateUpdates")}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Account Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-security-alerts">Security Alerts</Label>
                      <p className="text-sm text-muted-foreground">Receive emails about security alerts</p>
                    </div>
                    <Switch
                      id="email-security-alerts"
                      checked={emailSettings.securityAlerts}
                      onCheckedChange={() => toggleEmailSetting("securityAlerts")}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-account-changes">Account Changes</Label>
                      <p className="text-sm text-muted-foreground">Receive emails about account changes</p>
                    </div>
                    <Switch
                      id="email-account-changes"
                      checked={emailSettings.accountChanges}
                      onCheckedChange={() => toggleEmailSetting("accountChanges")}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Marketing Emails</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-marketing">Marketing Emails</Label>
                      <p className="text-sm text-muted-foreground">Receive marketing emails and promotions</p>
                    </div>
                    <Switch
                      id="email-marketing"
                      checked={emailSettings.marketingEmails}
                      onCheckedChange={() => toggleEmailSetting("marketingEmails")}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-newsletter">Newsletter</Label>
                      <p className="text-sm text-muted-foreground">Receive our monthly newsletter</p>
                    </div>
                    <Switch
                      id="email-newsletter"
                      checked={emailSettings.newsletterEmails}
                      onCheckedChange={() => toggleEmailSetting("newsletterEmails")}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-product-updates">Product Updates</Label>
                      <p className="text-sm text-muted-foreground">Receive emails about product updates</p>
                    </div>
                    <Switch
                      id="email-product-updates"
                      checked={emailSettings.productUpdates}
                      onCheckedChange={() => toggleEmailSetting("productUpdates")}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Email Digest</h3>
                <div className="space-y-2">
                  <Label htmlFor="digest-frequency">Email Digest Frequency</Label>
                  <Select value={emailDigestFrequency} onValueChange={setEmailDigestFrequency}>
                    <SelectTrigger id="digest-frequency">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="never">Never</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">Receive a digest of your activity and updates</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Save Email Preferences
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="push" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Push Notifications</CardTitle>
              <CardDescription>Manage the push notifications you receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Order Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="push-order-updates">Order Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive push notifications about your order status changes
                      </p>
                    </div>
                    <Switch
                      id="push-order-updates"
                      checked={pushSettings.orderUpdates}
                      onCheckedChange={() => togglePushSetting("orderUpdates")}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="push-order-shipped">Order Shipped</Label>
                      <p className="text-sm text-muted-foreground">Receive a push notification when your order ships</p>
                    </div>
                    <Switch
                      id="push-order-shipped"
                      checked={pushSettings.orderShipped}
                      onCheckedChange={() => togglePushSetting("orderShipped")}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Security Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="push-security-alerts">Security Alerts</Label>
                      <p className="text-sm text-muted-foreground">Receive push notifications about security alerts</p>
                    </div>
                    <Switch
                      id="push-security-alerts"
                      checked={pushSettings.securityAlerts}
                      onCheckedChange={() => togglePushSetting("securityAlerts")}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Save Push Notification Preferences
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="sms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SMS Notifications</CardTitle>
              <CardDescription>Manage the SMS notifications you receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Order Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="sms-order-shipped">Order Shipped</Label>
                      <p className="text-sm text-muted-foreground">Receive an SMS when your order ships</p>
                    </div>
                    <Switch
                      id="sms-order-shipped"
                      checked={smsSettings.orderShipped}
                      onCheckedChange={() => toggleSmsSetting("orderShipped")}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="sms-order-delivered">Order Delivered</Label>
                      <p className="text-sm text-muted-foreground">Receive an SMS when your order is delivered</p>
                    </div>
                    <Switch
                      id="sms-order-delivered"
                      checked={smsSettings.orderDelivered}
                      onCheckedChange={() => toggleSmsSetting("orderDelivered")}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Security Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="sms-security-alerts">Security Alerts</Label>
                      <p className="text-sm text-muted-foreground">Receive SMS notifications about security alerts</p>
                    </div>
                    <Switch
                      id="sms-security-alerts"
                      checked={smsSettings.securityAlerts}
                      onCheckedChange={() => toggleSmsSetting("securityAlerts")}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Save SMS Preferences
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
