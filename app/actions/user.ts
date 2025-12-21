'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache' // Fixed import

export async function updateProfile(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    const fullName = formData.get('fullName') as string
    const avatarUrl = formData.get('avatarUrl') as string

    const updates: any = {
        id: user.id,
        updated_at: new Date().toISOString()
    }

    if (fullName) {
        if (fullName.length < 2) {
            return { error: 'Name must be at least 2 characters' }
        }
        updates.full_name = fullName
    }

    if (avatarUrl) {
        updates.avatar_url = avatarUrl
    }

    const { error } = await supabase
        .from('profiles')
        .upsert(updates)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/settings')
    return { success: true }
}

export async function getOrCreateFriendCode() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('friend_code')
        .eq('id', user.id)
        .single()

    if (profile?.friend_code) {
        return { success: true, code: profile.friend_code }
    }

    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    const { error } = await supabase
        .from('profiles')
        .update({ friend_code: newCode })
        .eq('id', user.id)

    if (error) return { error: error.message }

    return { success: true, code: newCode }
}
