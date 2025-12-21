'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const habitSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  color: z.string().optional(),
})

export async function createHabit(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const rawData = {
    title: formData.get('title'),
    description: formData.get('description') || undefined,
    color: formData.get('color') || undefined,
  }

  const result = habitSchema.safeParse(rawData)

  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { error } = await supabase
    .from('habits')
    .insert({
      user_id: user.id,
      title: result.data.title,
      description: result.data.description,
      color: result.data.color,
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateHabit(habitId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const rawData = {
    title: formData.get('title'),
    color: formData.get('color') || undefined,
  }

  const result = habitSchema.safeParse(rawData)

  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { error } = await supabase
    .from('habits')
    .update({
      title: result.data.title,
      color: result.data.color,
    })
    .eq('id', habitId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteHabit(habitId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('habits')
    .delete()
    .eq('id', habitId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

// ... existing code ...

export async function toggleHabitCompletion(habitId: string, dateStr: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  // Validate format YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    return { error: "Invalid date format" };
  }

  // Check if already completed
  const { data: existingLog } = await supabase
    .from('habit_logs')
    .select('id')
    .eq('habit_id', habitId)
    .eq('completed_at', dateStr)
    .single()

  if (existingLog) {
    // Untick
    const { error } = await supabase
      .from('habit_logs')
      .delete()
      .eq('id', existingLog.id)

    if (error) return { error: error.message }
  } else {
    // Tick
    const { error } = await supabase
      .from('habit_logs')
      .insert({
        habit_id: habitId,
        user_id: user.id,
        completed_at: dateStr
      })

    if (error) return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath(`/share/${user.id}`) // Attempt to revalidate share path if code known? Hard to know code here.
  return { success: true }
}

export async function updateHabitNote(habitId: string, dateStr: string, note: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('habit_logs')
    .upsert({
      habit_id: habitId,
      user_id: user.id,
      completed_at: dateStr,
      notes: note
    }, {
      onConflict: 'habit_id, completed_at'
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}
