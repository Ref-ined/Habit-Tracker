'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

const authSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().optional(),
})

export async function login(formData: FormData) {
    const supabase = await createClient()

    // Parse and validate data
    const data = {
        email: formData.get('email'),
        password: formData.get('password'),
    }

    const result = authSchema.safeParse(data)
    if (!result.success) {
        return { error: "Invalid input" }
    }

    const { error } = await supabase.auth.signInWithPassword({
        email: result.data.email,
        password: result.data.password,
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email'),
        password: formData.get('password'),
        name: formData.get('name'),
    }

    // Basic Zod validation for signup
    const signupSchema = authSchema.extend({
        name: z.string().min(2, "Name must be at least 2 characters"),
    });

    const result = signupSchema.safeParse(data);

    if (!result.success) {
        // Return first error message
        return { error: result.error.issues[0].message };
    }

    const { error } = await supabase.auth.signUp({
        email: result.data.email,
        password: result.data.password,
        options: {
            data: {
                full_name: result.data.name,
            }
        }
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function updateEmail(email: string) {
    const supabase = await createClient()
    const { error } = await supabase.auth.updateUser({ email })
    if (error) return { error: error.message }
    return { success: true }
}

export async function updatePassword(password: string) {
    const supabase = await createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) return { error: error.message }
    return { success: true }
}

export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/')
}

