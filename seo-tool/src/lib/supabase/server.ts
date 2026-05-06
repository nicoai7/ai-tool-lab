import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// LINE認証に移行したため Supabase Auth は使用せず、service_role_key を使う admin client で DB操作のみ行う
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
