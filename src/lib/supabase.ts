import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client-side (anon key, RLS applies)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side (service role, bypasses RLS - use only in API routes)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export function normalizePhone(phone: string): string {
  // Hapus spasi, dash, plus
  let p = phone.replace(/[\s\-\+]/g, '');
  // Konversi +62/62 ke 0
  if (p.startsWith('62')) p = '0' + p.slice(2);
  return p;
}
