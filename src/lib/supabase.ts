import type { SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

let supabaseClientPromise: Promise<SupabaseClient> | null = null

export async function getSupabase() {
  if (!isSupabaseConfigured) return null

  supabaseClientPromise ??= import("@supabase/supabase-js").then(({ createClient }) =>
    createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: false,
      },
    }),
  )

  return supabaseClientPromise
}

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
  meal_time: string | null
  reaction: string
  note: string
  created_at: string
}
