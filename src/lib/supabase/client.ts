"use client";
import { createClient } from "@supabase/supabase-js";

/** Anon client for the browser. Used only for Realtime subscriptions. */
export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } },
);
