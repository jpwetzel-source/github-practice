import { getSupabaseClient } from "./supabase-client.js";
import { checkOutcome, computeEngineMove } from "./tic-tac-toe-engine.js";

const TABLE = "ttt_games";

function parseGameId() {
  var m = location.hash.match(/game=([0-9a-f-]{36})/i);
  return m ? m[1] : null;
}

function setHashForGame(id) {
  location.hash = "game=" + id;
}

function cellCenter(index) {
  var col = index % 3;
  var row = (index / 3) | 0;
  return { x: col * 100 + 50, y: row * 100 + 50 };
}

function setWinLineSvg(svgEl, line) {
  if (!svgEl) return;
  svgEl.innerHTML = "";
  if (!line || line.length !== 3) return;
  var a = cellCenter(line[0]);
  var c = cellCenter(line[2]);
  var dx = c.x - a.x;
  var dy = c.y - a.y;
  var len = Math.hypot(dx, dy) || 1;
  var ext = 18;
  var x1 = a.x - (dx / len) * ext;
  var y1 = a.y - (dy / len) * ext;
  var x2 = c.x + (dx / len) * ext;
  var y2 = c.y + (dy / len) * ext;
  var lineEl = document.createElementNS("http://www.w3.org/2000/svg", "line");
  lineEl.setAttribute("x1", String(x1));
  lineEl.setAttribute("y1", String(y1));
  lineEl.setAttribute("x2", String(x2));
  lineEl.setAttribute("y2", String(y2));
  lineEl.setAttribute("class", "ttt-win-line");
  svgEl.appendChild(lineEl);
}

function statusLabel(status) {
  if (status === "user_won") return "You won";
  if (status === "engine_won") return "Engine won";
  if (status === "draw") return "Draw";
  return "";
}

function isUserTurn(board) {
  var x = 0;
  var o = 0;
  for (var i = 0; i < 9; i++) {
    if (board[i] === "X") x++;
    else if (board[i] === "O") o++;
  }
  return x === o;
}

document.addEventListener("DOMContentLoaded", function () {
  var grid = document.getElementById("ttt-grid");
  var statusEl = document.getElementById("ttt-status");
  var resultEl = document.getElementById("ttt-result");
  var newBtn = document.getElementById("ttt-new-game");
  var copyBtn = document.getElementById("ttt-copy-link");
  var svgEl = document.getElementById("ttt-win-svg");
  var cells = grid ? grid.querySelectorAll(".ttt-cell") : [];

  var gameId = null;
  var busy = false;
  var rowSnapshot = null;

  function syncCopyButton() {
    if (copyBtn) copyBtn.disabled = !gameId;
  }

  function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg;
  }

  function setResult(text) {
    if (!resultEl) return;
    resultEl.textContent = text || "";
    resultEl.hidden = !text;
  }

  function paintBoard(board, status, winLine) {
    for (var i = 0; i < cells.length; i++) {
      var ch = board[i] || ".";
      var btn = cells[i];
      btn.textContent = ch === "." ? "" : ch;
      btn.dataset.mark = ch === "." ? "empty" : ch === "X" ? "x" : "o";
      var playable =
        status === "playing" &&
        ch === "." &&
        isUserTurn(board) &&
        !busy;
      btn.disabled = !playable;
      btn.setAttribute(
        "aria-label",
        ch === "."
          ? "Empty cell " + (i + 1)
          : ch === "X"
            ? "You, cell " + (i + 1)
            : "Engine, cell " + (i + 1)
      );
    }
    setWinLineSvg(svgEl, winLine);
    if (status !== "playing") {
      setResult(statusLabel(status));
    } else {
      setResult("");
    }
  }

  function renderFromRow(row) {
    rowSnapshot = row;
    syncCopyButton();
    var wl = row.winning_line;
    if (typeof wl === "string") {
      try {
        wl = JSON.parse(wl);
      } catch {
        wl = null;
      }
    }
    if (wl && !Array.isArray(wl)) wl = null;
    paintBoard(row.board, row.status, wl);
  }

  async function loadGame(id) {
    var client = await getSupabaseClient();
    if (!client) {
      setStatus("Configure Supabase to load a saved game.");
      return;
    }
    var res = await client.from(TABLE).select("*").eq("id", id).single();
    if (res.error) {
      setStatus("Could not load game. New game will start fresh.");
      gameId = null;
      syncCopyButton();
      location.hash = "";
      return;
    }
    gameId = id;
    renderFromRow(res.data);
    setStatus("Game loaded. You are X, engine is O.");
  }

  async function createGame() {
    var client = await getSupabaseClient();
    if (!client) {
      setStatus("Add supabase-config.js or deploy secrets to play online.");
      return;
    }
    busy = true;
    setStatus("Starting new game…");
    var res = await client
      .from(TABLE)
      .insert({ board: "........." })
      .select("*")
      .single();
    busy = false;
    if (res.error) {
      var msg = res.error.message || String(res.error);
      if (msg.indexOf("relation") !== -1 || msg.indexOf("does not exist") !== -1) {
        msg +=
          " Run supabase/migrations/20260418210000_tic_tac_toe_games.sql in the SQL Editor.";
      }
      setStatus("Could not create game: " + msg);
      return;
    }
    gameId = res.data.id;
    setHashForGame(gameId);
    renderFromRow(res.data);
    setStatus("You are X. Tap a cell.");
  }

  async function persistUpdate(payload) {
    var client = await getSupabaseClient();
    var res = await client
      .from(TABLE)
      .update({
        board: payload.board,
        status: payload.status,
        winning_line: payload.winning_line,
        updated_at: new Date().toISOString(),
      })
      .eq("id", gameId)
      .select("*")
      .single();
    if (res.error) {
      setStatus("Save failed: " + (res.error.message || String(res.error)));
      return null;
    }
    return res.data;
  }

  async function onCellClick(index) {
    if (busy || !gameId || !rowSnapshot) return;
    if (rowSnapshot.status !== "playing") return;
    var board = rowSnapshot.board;
    if (board[index] !== ".") return;
    if (!isUserTurn(board)) return;

    busy = true;
    for (var i = 0; i < cells.length; i++) cells[i].disabled = true;
    setStatus("Saving your move…");

    var afterX =
      board.slice(0, index) + "X" + board.slice(index + 1);
    var ux = checkOutcome(afterX);
    if (ux.winner === "user") {
      var r1 = await persistUpdate({
        board: afterX,
        status: "user_won",
        winning_line: ux.line,
      });
      busy = false;
      if (r1) renderFromRow(r1);
      else if (gameId) await loadGame(gameId);
      setStatus("Saved. Three in a row for you.");
      return;
    }
    if (ux.winner === "draw") {
      var r2 = await persistUpdate({
        board: afterX,
        status: "draw",
        winning_line: null,
      });
      busy = false;
      if (r2) renderFromRow(r2);
      else if (gameId) await loadGame(gameId);
      setStatus("Saved. Board is full.");
      return;
    }

    var ei = computeEngineMove(afterX);
    if (ei < 0) {
      busy = false;
      setStatus("Engine could not move.");
      paintBoard(rowSnapshot.board, rowSnapshot.status, rowSnapshot.winning_line);
      return;
    }
    var afterO =
      afterX.slice(0, ei) + "O" + afterX.slice(ei + 1);
    var fo = checkOutcome(afterO);
    var st = "playing";
    var line = null;
    if (fo.winner === "engine") {
      st = "engine_won";
      line = fo.line;
    } else if (fo.winner === "draw") {
      st = "draw";
    }

    var r3 = await persistUpdate({
      board: afterO,
      status: st,
      winning_line: line,
    });
    busy = false;
    if (r3) renderFromRow(r3);
    else if (gameId) await loadGame(gameId);
    if (st === "playing") setStatus("Your turn again.");
    else if (st === "engine_won") setStatus("Engine completed a winning row.");
    else setStatus("Game over, draw.");
  }

  if (grid) {
    grid.addEventListener("click", function (ev) {
      var t = ev.target.closest(".ttt-cell");
      if (!t || !grid.contains(t)) return;
      var idx = parseInt(t.getAttribute("data-index"), 10);
      if (idx >= 0 && idx < 9) onCellClick(idx);
    });
  }

  if (newBtn) {
    newBtn.addEventListener("click", function () {
      gameId = null;
      rowSnapshot = null;
      syncCopyButton();
      location.hash = "";
      setWinLineSvg(svgEl, null);
      setResult("");
      createGame();
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener("click", async function () {
      if (!gameId) return;
      var url = location.origin + location.pathname + "#game=" + gameId;
      try {
        await navigator.clipboard.writeText(url);
        setStatus("Link copied.");
      } catch {
        setStatus("Copy blocked. Link: " + url);
      }
    });
  }

  window.addEventListener("hashchange", function () {
    var id = parseGameId();
    if (id) loadGame(id);
  });

  (async function init() {
    var id = parseGameId();
    if (id) await loadGame(id);
    else {
      syncCopyButton();
      setStatus("Start a new game to play against the engine.");
      paintBoard(".........", "playing", null);
      if (cells.length)
        for (var j = 0; j < cells.length; j++) cells[j].disabled = true;
    }
  })();
});
