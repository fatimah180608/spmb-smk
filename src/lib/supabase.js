import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim() || "";
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || "";
export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

export const supabase = supabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

export function getSupabaseSetupMessage() {
  return "Supabase belum terhubung. Pastikan file .env.local berisi VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY, lalu restart npm run dev.";
}
