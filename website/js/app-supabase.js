import {
  getSupabaseClient,
  pingSupabaseAuth,
  probeConnectivityTable,
} from "./supabase-client.js";

function setStatus(el, message, state) {
  el.textContent = message;
  el.dataset.state = state;
}

function setLight(el, state) {
  if (!el) return;
  el.dataset.state = state;
  var titles = {
    ok: "Database check succeeded",
    error: "Database check failed",
    pending: "Checking",
    off: "Not checked yet",
  };
  el.title = titles[state] || titles.off;
}

document.addEventListener("DOMContentLoaded", async function () {
  var statusEl = document.getElementById("supabase-status");
  var lightEl = document.getElementById("supabase-light");
  var btn = document.getElementById("supabase-check-btn");
  if (!statusEl || !btn) return;

  setLight(lightEl, "off");

  var ping = await pingSupabaseAuth();
  if (ping.reason === "not_configured") {
    setStatus(
      statusEl,
      "Supabase is not configured. Add supabase-config.js locally or GitHub Actions secrets SUPABASE_URL and SUPABASE_ANON_KEY, then use Check database.",
      "idle"
    );
    btn.disabled = true;
    return;
  }

  if (!ping.ok) {
    var detail =
      ping.reason && ping.reason.indexOf("http_") === 0
        ? ping.reason.replace("http_", "")
        : ping.reason || "unknown";
    setStatus(
      statusEl,
      "Could not reach Supabase (HTTP " + detail + "). Check URL and anon key, then try again.",
      "error"
    );
    btn.disabled = true;
    return;
  }

  var client = await getSupabaseClient();
  if (!client) {
    setStatus(statusEl, "Supabase client failed to initialize.", "error");
    btn.disabled = true;
    return;
  }

  setStatus(
    statusEl,
    "API is reachable. Click Check database to read the connectivity row.",
    "idle"
  );

  btn.addEventListener("click", async function () {
    btn.disabled = true;
    setLight(lightEl, "pending");
    setStatus(statusEl, "Checking database…", "idle");

    var result = await probeConnectivityTable();

    btn.disabled = false;

    if (result.ok) {
      setLight(lightEl, "ok");
      setStatus(
        statusEl,
        "Database OK. Read status value: " + result.value + ".",
        "ok"
      );
      return;
    }

    setLight(lightEl, "error");

    if (result.reason === "not_configured") {
      setStatus(
        statusEl,
        "Not configured. Add secrets or supabase-config.js with URL and anon key.",
        "error"
      );
      return;
    }

    var hint = "";
    var d = (result.detail || "").toLowerCase();
    if (
      d.indexOf("relation") !== -1 ||
      d.indexOf("does not exist") !== -1 ||
      result.code === "42P01" ||
      result.code === "PGRST205"
    ) {
      hint =
        " Run the SQL in supabase/migrations/20260418120000_app_connectivity_probe.sql in the Supabase SQL Editor once.";
    }

    setStatus(
      statusEl,
      "Database check failed: " + (result.detail || result.reason) + "." + hint,
      "error"
    );
  });
});
