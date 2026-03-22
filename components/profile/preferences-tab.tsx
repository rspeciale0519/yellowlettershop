"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Save, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { UserProfile } from './types'

interface PreferencesTabProps {
  profile: UserProfile
  onProfileUpdate: (updates: Partial<UserProfile>) => Promise<boolean>
}

export function PreferencesTab({ profile, onProfileUpdate }: PreferencesTabProps) {
  const [saving, setSaving] = useState(false)

  const handlePreferencesSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {
      setSaving(true)
      const formData = new FormData(e.currentTarget)
      
      const updates = {
        email_notifications: formData.get('email-notifications') === 'on',
        sms_notifications: formData.get('sms-notifications') === 'on',
        marketing_emails: formData.get('marketing-emails') === 'on',
      }

      await onProfileUpdate(updates)
      toast.success('Preferences updated successfully!')
    } catch (error) {
      console.error('Error updating preferences:', error)
      toast.error('Failed to update preferences')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <form onSubmit={handlePreferencesSave}>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Manage how you receive notifications and updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications" className="text-base">
                Email Notifications
              </Label>
              <div className="text-[0.8rem] text-muted-foreground">
                Receive email notifications about your account activity
              </div>
            </div>
            <Switch
              id="email-notifications"
              name="email-notifications"
              defaultChecked={profile.email_notifications}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sms-notifications" className="text-base">
                SMS Notifications
              </Label>
              <div className="text-[0.8rem] text-muted-foreground">
                Receive text messages for important updates
              </div>
            </div>
            <Switch
              id="sms-notifications"
              name="sms-notifications"
              defaultChecked={profile.sms_notifications}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="marketing-emails" className="text-base">
                Marketing Emails
              </Label>
              <div className="text-[0.8rem] text-muted-foreground">
                Receive emails about new features, tips, and promotions
              </div>
            </div>
            <Switch
              id="marketing-emails"
              name="marketing-emails"
              defaultChecked={profile.marketing_emails}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}