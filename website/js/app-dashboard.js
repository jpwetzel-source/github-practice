import { getSupabaseClient } from "./supabase-client.js";

const TABLE = "ttt_games";

function byId(id) {
  return document.getElementById(id);
}

async function countByStatus(client, status) {
  var res = await client
    .from(TABLE)
    .select("*", { count: "exact", head: true })
    .eq("status", status);
  if (res.error) throw res.error;
  return res.count ?? 0;
}

async function countAll(client) {
  var res = await client.from(TABLE).select("*", { count: "exact", head: true });
  if (res.error) throw res.error;
  return res.count ?? 0;
}

async function refreshDashboard() {
  var note = byId("stats-status");
  var setNum = function (id, n) {
    var el = byId(id);
    if (el) el.textContent = typeof n === "number" ? String(n) : "–";
  };

  var client = await getSupabaseClient();
  if (!client) {
    if (note) note.textContent = "Add Supabase config to load outcome totals.";
    setNum("stat-user-won", null);
    setNum("stat-engine-won", null);
    setNum("stat-draw", null);
    setNum("stat-playing", null);
    setNum("stat-total", null);
    return;
  }

  if (note) note.textContent = "Loading…";

  try {
    var results = await Promise.all([
      countByStatus(client, "user_won"),
      countByStatus(client, "engine_won"),
      countByStatus(client, "draw"),
      countByStatus(client, "playing"),
      countAll(client),
    ]);
    setNum("stat-user-won", results[0]);
    setNum("stat-engine-won", results[1]);
    setNum("stat-draw", results[2]);
    setNum("stat-playing", results[3]);
    setNum("stat-total", results[4]);
    if (note) note.textContent = "";
  } catch (err) {
    var msg = err && err.message ? err.message : String(err);
    if (msg.indexOf("relation") !== -1 || msg.indexOf("does not exist") !== -1) {
      msg +=
        " Create the table with supabase/migrations/20260418210000_tic_tac_toe_games.sql.";
    }
    if (note) note.textContent = msg;
    setNum("stat-user-won", null);
    setNum("stat-engine-won", null);
    setNum("stat-draw", null);
    setNum("stat-playing", null);
    setNum("stat-total", null);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  var btn = byId("stats-refresh");
  if (btn) btn.addEventListener("click", refreshDashboard);
  refreshDashboard();
});

window.addEventListener("ttt-stats-refresh", refreshDashboard);
