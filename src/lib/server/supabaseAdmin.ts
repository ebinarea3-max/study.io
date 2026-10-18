import 'server-only';
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

let adminClient: SupabaseClient | null = null;

/**
 * Returns a server-only Supabase client initialized with the service role key.
 * Bypasses RLS to manage subscriptions and idempotency logs securely on the server.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (adminClient) {
    return adminClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Server configuration error: SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL must be configured.'
    );
  }

  adminClient = createSupabaseClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return adminClient;
}
