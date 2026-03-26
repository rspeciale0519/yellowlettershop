"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"

import { PersonalInfoTab } from "./personal-info-tab"
import { BusinessInfoTab } from "./business-info-tab"
import { PreferencesTab } from "./preferences-tab"
import { UserProfile } from "./types"

export default function ProfilePageContent() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (profile) {
          setProfile({
            ...profile,
            email: user.email,
          })
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return

    try {
      console.log('🔄 Updating profile for user:', user.id, 'with updates:', updates)
      
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()

      if (error) {
        console.error('❌ Database update error:', error)
        throw error
      }

      console.log('✅ Database update successful:', data)
      console.log('🔄 Updating local state from:', profile.avatar_url, 'to:', updates.avatar_url)

      const updatedProfile = { ...profile, ...updates }
      setProfile(updatedProfile)
      
      console.log('✅ Local state updated, new avatar_url:', updatedProfile.avatar_url)
      return true
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
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
          <PersonalInfoTab 
            user={user}
            profile={profile}
            onProfileUpdate={updateProfile}
          />
        </TabsContent>

        <TabsContent value="business" className="space-y-6">
          <BusinessInfoTab 
            profile={profile}
            onProfileUpdate={updateProfile}
          />
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <PreferencesTab 
            profile={profile}
            onProfileUpdate={updateProfile}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}