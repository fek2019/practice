/**
 * OTP code store.
 *
 * Primary backend: Supabase `auth_codes` table (persistent, multi-instance safe).
 * Fallback: in-memory Map (development / SQLite mode only).
 *
 * All public functions are async so callers are identical regardless of backend.
 */

import { isSupabaseConfigured } from "./config";
import { createSupabaseAdminClient } from "./supabase/client";

const TTL_MS = 10 * 60 * 1000; // 10 minutes

// ─── In-memory fallback ──────────────────────────────────────────────────────

type MemEntry = { code: string; expiresAt: number };
const memStore = new Map<string, MemEntry>();

// ─── Supabase helpers ────────────────────────────────────────────────────────

type CodeRow = {
  id: string;
  identifier: string;
  code: string;
  expires_at: string;
};

async function sbStore(identifier: string, code: string) {
  const db = createSupabaseAdminClient();

  // Remove any existing code for this identifier first
  await db.from("auth_codes").delete().eq("identifier", identifier);

  const { error } = await db.from("auth_codes").insert({
    identifier,
    code,
    expires_at: new Date(Date.now() + TTL_MS).toISOString(),
  });

  if (error) {
    throw new Error(`auth_codes insert failed: ${error.message}`);
  }
}

async function sbVerify(identifier: string, code: string): Promise<boolean> {
  const db = createSupabaseAdminClient();

  const { data, error } = await db
    .from("auth_codes")
    .select("id, code, expires_at")
    .eq("identifier", identifier)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return false;

  const row = data as CodeRow;
  const valid =
    row.code === code && new Date(row.expires_at).getTime() > Date.now();

  // Always delete — whether valid or not, to avoid brute-force reuse
  await db.from("auth_codes").delete().eq("identifier", identifier);

  return valid;
}

// Also clean up rows that expired long ago (best-effort, no throw)
async function sbPurgeExpired() {
  try {
    const db = createSupabaseAdminClient();
    await db
      .from("auth_codes")
      .delete()
      .lt("expires_at", new Date(Date.now() - TTL_MS).toISOString());
  } catch {
    // Non-critical — ignore errors
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Store a new OTP code for `identifier` (email or phone).
 * Replaces any existing code for the same identifier.
 */
export async function storeCode(identifier: string, code: string) {
  if (isSupabaseConfigured()) {
    void sbPurgeExpired(); // fire-and-forget cleanup
    return sbStore(identifier, code);
  }

  memStore.set(identifier, { code, expiresAt: Date.now() + TTL_MS });
}

/**
 * Verify `code` for `identifier`. Returns true if valid.
 * Consumes the code on success (one-time use).
 */
export async function verifyCode(
  identifier: string,
  code: string
): Promise<boolean> {
  if (isSupabaseConfigured()) {
    return sbVerify(identifier, code);
  }

  const entry = memStore.get(identifier);
  if (!entry || entry.expiresAt < Date.now() || entry.code !== code) {
    return false;
  }
  memStore.delete(identifier);
  return true;
}
