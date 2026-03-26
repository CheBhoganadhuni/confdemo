// Supabase client configuration
// This file will be updated when Supabase integration is connected

// Placeholder - replace with actual Supabase client when integration is added
// import { createBrowserClient } from '@supabase/ssr'
// 
// export function createClient() {
//   return createBrowserClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
//   )
// }

export function createClient() {
  console.warn('[Jnana Sethu] Supabase not configured. Add integration to enable auth and database.')
  return null
}
