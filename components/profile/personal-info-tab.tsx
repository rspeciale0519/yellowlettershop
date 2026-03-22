"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload, Save, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/utils/supabase/client"
import { ImageCropModal } from './image-crop-modal'
import { UserProfile } from './types'

interface PersonalInfoTabProps {
  user: any
  profile: UserProfile
  onProfileUpdate: (updates: Partial<UserProfile>) => Promise<boolean>
}

export function PersonalInfoTab({ user, profile, onProfileUpdate }: PersonalInfoTabProps) {
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [avatarTimestamp, setAvatarTimestamp] = useState(Date.now())
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '')
    
    if (digits.length <= 3) {
      return digits
    } else if (digits.length <= 6) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`
    } else if (digits.length <= 10) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`
    } else {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}`
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    e.target.value = formatted
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const maxSize = 2 * 1024 * 1024 // 2MB
      if (file.size > maxSize) {
        toast.error('Image size must be less than 2MB')
        return
      }
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a valid image file (JPG, PNG, GIF, or WebP)')
        return
      }

      setSelectedImageFile(file)
      setCropModalOpen(true)
    }
  }

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    if (!user) return

    try {
      setUploadingImage(true)
      setCropModalOpen(false)

      // Convert blob to file
      const file = new File([croppedImageBlob], 'avatar.png', { type: 'image/png' })
      const fileName = `${user.id}/avatar_${Date.now()}.png`

      console.log('🔄 Uploading avatar:', { fileName, fileSize: file.size })

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('❌ Upload error:', uploadError)
        throw uploadError
      }

      console.log('✅ Upload successful:', uploadData)

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(fileName)

      console.log('🔗 Generated public URL:', publicUrl)

      // Update profile with new avatar URL
      const updateResult = await onProfileUpdate({ avatar_url: publicUrl })
      console.log('📝 Profile update result:', updateResult)
      
      if (updateResult) {
        // Update timestamp to force image refresh
        setAvatarTimestamp(Date.now())
        
        // Emit custom event to update header avatar
        const avatarUpdatedEvent = new CustomEvent('avatar-updated', { 
          detail: { avatarUrl: publicUrl } 
        })
        window.dispatchEvent(avatarUpdatedEvent)
        
        toast.success('Profile picture updated successfully!')
      } else {
        throw new Error('Profile update failed')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error(`Failed to upload image: ${error.message}`)
    } finally {
      setUploadingImage(false)
      setSelectedImageFile(null)
    }
  }

  const handlePersonalInfoSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user) return

    try {
      setSaving(true)
      const formData = new FormData(e.currentTarget)
      
      const updates = {
        full_name: formData.get('full-name') as string,
        first_name: formData.get('first-name') as string,
        last_name: formData.get('last-name') as string,
        phone: formData.get('phone') as string,
        bio: formData.get('bio') as string,
      }

      await onProfileUpdate(updates)
      toast.success('Personal information updated successfully!')
    } catch (error) {
      console.error('Error updating personal info:', error)
      toast.error('Failed to update personal information')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>This will be displayed on your profile and in your communications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-24 w-24 cursor-pointer hover:opacity-80 transition-opacity" onClick={handleAvatarClick}>
              <AvatarImage 
                src={profile.avatar_url ? `${profile.avatar_url}?t=${avatarTimestamp}` : '/placeholder-user.jpg'} 
                alt="Profile"
                key={profile.avatar_url} 
              />
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
        <form onSubmit={handlePersonalInfoSave}>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your personal details and contact information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full-name">Full Name</Label>
                <Input
                  id="full-name"
                  name="full-name"
                  type="text"
                  defaultValue={profile.full_name || ''}
                  placeholder="Your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">First Name</Label>
                <Input
                  id="first-name"
                  name="first-name"
                  type="text"
                  defaultValue={profile.first_name || ''}
                  placeholder="First name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input
                  id="last-name"
                  name="last-name"
                  type="text"
                  defaultValue={profile.last_name || ''}
                  placeholder="Last name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={profile.phone || ''}
                placeholder="123-456-7890"
                onChange={handlePhoneChange}
                maxLength={12}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                defaultValue={profile.bio || ''}
                placeholder="Tell us about yourself..."
                rows={4}
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

      <ImageCropModal
        isOpen={cropModalOpen}
        onClose={() => {
          setCropModalOpen(false)
          setSelectedImageFile(null)
        }}
        imageFile={selectedImageFile}
        onCropComplete={handleCropComplete}
      />
    </>
  )
}