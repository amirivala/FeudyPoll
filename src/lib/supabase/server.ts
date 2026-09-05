import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database";

let cached: SupabaseClient<Database> | null = null;

/** Service-role client. Server only; bypasses RLS. */
export function supabaseAdmin(): SupabaseClient<Database> {
  if (!cached) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Supabase env vars missing");
    cached = createClient<Database>(url, key, { auth: { persistSession: false } });
  }
  return cached;
}
