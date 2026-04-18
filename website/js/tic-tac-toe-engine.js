/**
 * Perfect-play minimax for the engine (O). User plays X.
 */

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function checkOutcome(board) {
  for (const [a, b, c] of LINES) {
    const tri = board[a] + board[b] + board[c];
    if (tri === "XXX") return { winner: "user", line: [a, b, c] };
    if (tri === "OOO") return { winner: "engine", line: [a, b, c] };
  }
  if (!board.includes(".")) return { winner: "draw", line: null };
  return { winner: null, line: null };
}

function scoreTerminal(outcome, depth) {
  if (outcome.winner === "engine") return 10 - depth;
  if (outcome.winner === "user") return depth - 10;
  return 0;
}

function minimax(board, engineTurn, depth) {
  const terminal = checkOutcome(board);
  if (terminal.winner !== null) return scoreTerminal(terminal, depth);

  if (engineTurn) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] !== ".") continue;
      const next = board.slice(0, i) + "O" + board.slice(i + 1);
      best = Math.max(best, minimax(next, false, depth + 1));
    }
    return best;
  }
  let best = Infinity;
  for (let i = 0; i < 9; i++) {
    if (board[i] !== ".") continue;
    const next = board.slice(0, i) + "X" + board.slice(i + 1);
    best = Math.min(best, minimax(next, true, depth + 1));
  }
  return best;
}

export function computeEngineMove(board) {
  let bestI = -1;
  let bestScore = -Infinity;
  for (let i = 0; i < 9; i++) {
    if (board[i] !== ".") continue;
    const next = board.slice(0, i) + "O" + board.slice(i + 1);
    const s = minimax(next, false, 0);
    if (s > bestScore) {
      bestScore = s;
      bestI = i;
    }
  }
  return bestI;
}
