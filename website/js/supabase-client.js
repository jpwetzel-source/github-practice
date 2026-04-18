import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

let cachedClient = null;

function hasPlaceholders(url, key) {
  if (!url || !key) return true;
  if (!url.startsWith("https://") || !url.includes(".supabase.co")) return true;
  if (key.includes("YOUR_") || key.length < 16) return true;
  return false;
}

function readClientKey(mod) {
  if (mod.supabasePublishableKey != null && mod.supabasePublishableKey !== "") {
    return mod.supabasePublishableKey;
  }
  if (mod.supabaseAnonKey != null && mod.supabaseAnonKey !== "") {
    return mod.supabaseAnonKey;
  }
  return undefined;
}

export async function loadSupabaseConfig() {
  try {
    const mod = await import("../supabase-config.js");
    var key = readClientKey(mod);
    return {
      url: mod.supabaseUrl,
      key: key,
    };
  } catch {
    return null;
  }
}

export async function getSupabaseClient() {
  if (cachedClient) return cachedClient;
  const cfg = await loadSupabaseConfig();
  if (!cfg || hasPlaceholders(cfg.url, cfg.key)) return null;
  cachedClient = createClient(cfg.url, cfg.key);
  return cachedClient;
}

/** Lightweight reachability check (no table required). */
export async function pingSupabaseAuth() {
  const cfg = await loadSupabaseConfig();
  if (!cfg || hasPlaceholders(cfg.url, cfg.key)) {
    return { ok: false, reason: "not_configured" };
  }
  const base = cfg.url.replace(/\/$/, "");
  const res = await fetch(base + "/auth/v1/health", {
    headers: {
      apikey: cfg.key,
      Authorization: "Bearer " + cfg.key,
    },
  });
  if (!res.ok) return { ok: false, reason: "http_" + res.status };
  return { ok: true };
}

const CONNECTIVITY_TABLE = "app_connectivity_probe";

/** Reads the probe row; requires the SQL migration applied on the project. */
export async function probeConnectivityTable() {
  const client = await getSupabaseClient();
  if (!client) {
    return { ok: false, reason: "not_configured", detail: null };
  }
  const { data, error } = await client
    .from(CONNECTIVITY_TABLE)
    .select("status")
    .eq("id", 1)
    .maybeSingle();
  if (error) {
    return {
      ok: false,
      reason: "query_error",
      detail: error.message || String(error),
      code: error.code || null,
    };
  }
  if (!data || data.status !== "ok") {
    return {
      ok: false,
      reason: "bad_value",
      detail: data ? JSON.stringify(data) : "no row",
    };
  }
  return { ok: true, value: data.status };
}
