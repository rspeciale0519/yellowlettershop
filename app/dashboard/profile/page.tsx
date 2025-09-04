"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Upload, Save, Loader2 } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"
import { ImageCropModal } from '@/components/profile/image-crop-modal'

interface UserProfile {
  id: string
  user_id: string
  email?: string
  full_name?: string
  first_name?: string
  last_name?: string
  phone?: string
  bio?: string
  company_name?: string
  job_title?: string
  street_address?: string
  city?: string
  state?: string
  zip_code?: string
  country?: string
  avatar_url?: string
  email_notifications?: boolean
  sms_notifications?: boolean
  marketing_emails?: boolean
}

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const supabase = createClient()

  // Format phone number as user types (###-###-####)
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    
    // Apply formatting
    if (digits.length >= 6) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`
    } else if (digits.length >= 3) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}`
    } else {
      return digits
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    e.target.value = formatted
  }

  // Click handler to trigger file input when avatar is clicked
  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  // Load user profile on mount
  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true)
        
        // Get current user
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError
        if (!currentUser) throw new Error('No user found')
        
        setUser(currentUser)
        
        // Check if user_profiles table exists, if not use user metadata
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', currentUser.id)
          .single()
        
        if (profileData) {
          setProfile(profileData)
        } else {
          // Create profile from user metadata if it doesn't exist
          const newProfile: Partial<UserProfile> = {
            user_id: currentUser.id,
            full_name: currentUser.user_metadata?.full_name || '',
            avatar_url: currentUser.user_metadata?.avatar_url || '',
            email_notifications: true,
            sms_notifications: false,
            marketing_emails: true,
          }
          
          const { data: createdProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert([newProfile])
            .select()
            .single()
          
          if (createError) {
            console.warn('Profile table may not exist, using metadata:', createError)
            setProfile(newProfile as UserProfile)
          } else {
            setProfile(createdProfile)
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error)
        toast.error('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('File must be an image')
      return
    }

    // Set the selected file and open crop modal
    setSelectedImageFile(file)
    setCropModalOpen(true)
    
    // Reset the file input
    e.target.value = ''
  }

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    if (!user) return

    try {
      setUploadingImage(true)
      
      const fileName = `avatar-${Date.now()}.jpg`
      const filePath = `${user.id}/${fileName}`

      // Upload cropped image to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, croppedImageBlob, {
          upsert: true
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath)

      const avatarUrl = urlData.publicUrl

      // Update user metadata and profile
      const { error: updateError } = await supabase.auth.updateUser({
        data: { 
          avatar_url: avatarUrl 
        }
      })

      if (updateError) throw updateError

      // Update profile in database
      if (profile) {
        const { error: profileUpdateError } = await supabase
          .from('user_profiles')
          .update({ avatar_url: avatarUrl })
          .eq('user_id', user.id)

        if (profileUpdateError) {
          console.warn('Profile update error:', profileUpdateError)
        }

        setProfile({ ...profile, avatar_url: avatarUrl })
      }

      // Trigger header avatar update without full page reload
      window.dispatchEvent(new CustomEvent('avatar-updated', { detail: { avatarUrl } }))
      
      toast.success('Profile image updated successfully!')
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  const handlePersonalInfoSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user || !profile) return

    try {
      setSaving(true)
      const formData = new FormData(e.currentTarget)
      
      const firstName = formData.get('first_name') as string
      const lastName = formData.get('last_name') as string
      const fullName = `${firstName} ${lastName}`.trim()
      
      const updates = {
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        phone: formData.get('phone') as string,
        bio: formData.get('bio') as string,
      }

      // Update user metadata
      const { error: userError } = await supabase.auth.updateUser({
        data: { 
          full_name: fullName 
        }
      })

      if (userError) throw userError

      // Update profile in database
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', user.id)

      if (profileError) {
        console.warn('Profile update error:', profileError)
      }

      setProfile({ ...profile, ...updates })
      toast.success('Personal information updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleBusinessInfoSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user || !profile) return

    try {
      setSaving(true)
      const formData = new FormData(e.currentTarget)
      
      const updates = {
        company_name: formData.get('company') as string,
        job_title: formData.get('jobTitle') as string,
        street_address: formData.get('street') as string,
        city: formData.get('city') as string,
        state: formData.get('state') as string,
        zip_code: formData.get('zip') as string,
        country: formData.get('country') as string,
      }

      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', user.id)

      if (error) throw error

      setProfile({ ...profile, ...updates })
      toast.success('Business information updated successfully!')
    } catch (error) {
      console.error('Error updating business info:', error)
      toast.error('Failed to update business information')
    } finally {
      setSaving(false)
    }
  }

  const handlePreferencesSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user || !profile) return

    try {
      setSaving(true)
      const formData = new FormData(e.currentTarget)
      
      const updates = {
        email_notifications: formData.get('email-notifications') === 'on',
        sms_notifications: formData.get('sms-notifications') === 'on',
        marketing_emails: formData.get('marketing-emails') === 'on',
      }

      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', user.id)

      if (error) throw error

      setProfile({ ...profile, ...updates })
      toast.success('Preferences updated successfully!')
    } catch (error) {
      console.error('Error updating preferences:', error)
      toast.error('Failed to update preferences')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Unable to load profile information</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList>
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="business">Business Info</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>This will be displayed on your profile and in your communications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-24 w-24 cursor-pointer hover:opacity-80 transition-opacity" onClick={handleAvatarClick}>
                  <AvatarImage src={profile.avatar_url || '/placeholder-user.jpg'} alt="Profile" />
                  <AvatarFallback>{profile.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                  <Label htmlFor="picture" className="cursor-pointer">
                    <div className="flex items-center gap-2">
                      {uploadingImage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      <span>{uploadingImage ? 'Uploading...' : 'Upload new image'}</span>
                    </div>
                  </Label>
                  <Input 
                    id="picture" 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">JPG, PNG or GIF. Max size 2MB.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <form onSubmit={handlePersonalInfoSave}>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input id="first_name" name="first_name" defaultValue={profile.first_name || profile.full_name?.split(' ')[0] || ''} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input id="last_name" name="last_name" defaultValue={profile.last_name || profile.full_name?.split(' ').slice(1).join(' ') || ''} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" value={user?.email || profile.email || ''} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input 
                      id="phone" 
                      name="phone" 
                      type="tel" 
                      placeholder="123-456-7890"
                      maxLength={12}
                      defaultValue={formatPhoneNumber(profile.phone || '')}
                      onChange={handlePhoneChange}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    placeholder="Tell us about yourself"
                    defaultValue={profile.bio || ''}
                    className="min-h-[100px]"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Update your business details</CardDescription>
            </CardHeader>
            <form onSubmit={handleBusinessInfoSave}>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="company">Company Name</Label>
                    <Input id="company" name="company" defaultValue={profile.company_name || ''} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input id="jobTitle" name="jobTitle" defaultValue={profile.job_title || ''} />
                  </div>
                </div>

                <Separator className="my-4" />

                <div>
                  <h3 className="mb-4 text-lg font-medium">Business Address</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="street">Street Address</Label>
                      <Input id="street" name="street" defaultValue={profile.street_address || ''} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" name="city" defaultValue={profile.city || ''} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input id="state" name="state" defaultValue={profile.state || ''} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip">ZIP Code</Label>
                      <Input id="zip" name="zip" defaultValue={profile.zip_code || ''} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Select name="country" defaultValue={profile.country || 'United States'}>
                        <SelectTrigger id="country">
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="United States">United States</SelectItem>
                          <SelectItem value="Canada">Canada</SelectItem>
                          <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                          <SelectItem value="Australia">Australia</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <form onSubmit={handlePreferencesSave}>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive order updates and important alerts via email</p>
                  </div>
                  <Switch 
                    id="email-notifications" 
                    name="email-notifications"
                    defaultChecked={profile.email_notifications ?? true} 
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sms-notifications">SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive order updates and important alerts via text message
                    </p>
                  </div>
                  <Switch 
                    id="sms-notifications" 
                    name="sms-notifications"
                    defaultChecked={profile.sms_notifications ?? false} 
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="marketing-emails">Marketing Emails</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive promotional offers, new product announcements, and tips
                    </p>
                  </div>
                  <Switch 
                    id="marketing-emails" 
                    name="marketing-emails"
                    defaultChecked={profile.marketing_emails ?? true} 
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {saving ? 'Saving...' : 'Save Preferences'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Image Crop Modal */}
      <ImageCropModal
        isOpen={cropModalOpen}
        onClose={() => setCropModalOpen(false)}
        onCropComplete={handleCropComplete}
        imageFile={selectedImageFile}
      />
    </div>
  )
}
