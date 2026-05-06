import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// anon key の Supabase client（DBアクセス専用、認証は LINE 側）
export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
