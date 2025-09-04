import { createClient } from '@/utils/supabase/client'
import type { Team, ContactCard } from '@/types/supabase'

// =================================================================================
// Team Management Functions
// =================================================================================

export async function createTeam(data: {
  name: string
  plan: 'team' | 'enterprise'
  max_seats?: number
}): Promise<Team> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('User not authenticated')
  
  const { data: team, error } = await supabase
    .from('teams')
    .insert({
      ...data,
      owner_id: user.id,
      max_seats: data.max_seats || (data.plan === 'team' ? 3 : 10)
    })
    .select()
    .single()

  if (error) throw error
  return team
}

export async function getTeams(): Promise<Team[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('User not authenticated')
  
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .or(`owner_id.eq.${user.id},id.in.(${
      // Get teams where user is a member
      'SELECT team_id FROM user_profiles WHERE user_id = ' + user.id
    })`)

  if (error) throw error
  return data || []
}

export async function updateTeam(id: string, updates: Partial<Team>): Promise<Team> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('teams')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// =================================================================================
// Contact Card Functions
// =================================================================================

export async function getContactCards(): Promise<ContactCard[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('User not authenticated')
  
  const { data, error } = await supabase
    .from('contact_cards')
    .select('*')
    .eq('is_soft_deleted', false)
    .order('is_default', { ascending: false })
    .order('name')

  if (error) throw error
  return data || []
}

export async function createContactCard(cardData: Omit<ContactCard, 'id' | 'created_at' | 'updated_at'>): Promise<ContactCard> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('User not authenticated')
  
  const { data, error } = await supabase
    .from('contact_cards')
    .insert({
      ...cardData,
      user_id: user.id
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateContactCard(id: string, updates: Partial<ContactCard>): Promise<ContactCard> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('contact_cards')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteContactCard(id: string): Promise<void> {
  const supabase = createClient()
  
  // Soft delete to maintain limits counting
  const { error } = await supabase
    .from('contact_cards')
    .update({
      is_soft_deleted: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) throw error
}

export async function setDefaultContactCard(id: string): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('User not authenticated')
  
  // First, unset all other defaults for this user
  await supabase
    .from('contact_cards')
    .update({ is_default: false })
    .eq('user_id', user.id)
    .eq('is_soft_deleted', false)

  // Then set the selected card as default
  const { error } = await supabase
    .from('contact_cards')
    .update({ is_default: true })
    .eq('id', id)

  if (error) throw error
}
