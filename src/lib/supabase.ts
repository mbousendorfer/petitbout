import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: false,
      },
    })
  : null

export type BabyProfileRow = {
  family_code_hash: string
  age_months: number
  updated_at: string
}

export type BabyFoodTestRow = {
  id: string
  family_code_hash: string
  food_id: string
  date: string
  reaction: string
  note: string
  created_at: string
}
