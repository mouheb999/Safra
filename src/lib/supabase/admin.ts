// Server-only Supabase client with the secret key (service_role). It bypasses RLS, so it is only
// used to call public.submit_request() — never import this from a client component.

import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

let client: SupabaseClient<Database> | null = null;

/** Null until SUPABASE_SECRET_KEY is set; callers then hand off to WhatsApp without storing. */
export function getAdminClient(): SupabaseClient<Database> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) return null;
  client ??= createClient<Database>(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return client;
}
