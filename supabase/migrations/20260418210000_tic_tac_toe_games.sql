-- Tic tac toe games: board state and outcome persisted for the static site.
-- Run in Supabase SQL Editor if you do not apply migrations via CLI.

create table if not exists public.ttt_games (
  id uuid primary key default gen_random_uuid(),
  board text not null default '.........',
  status text not null default 'playing'
    check (status in ('playing', 'user_won', 'engine_won', 'draw')),
  winning_line integer[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ttt_board_len check (char_length(board) = 9),
  constraint ttt_board_chars check (board ~ '^[.XO]{9}$'),
  constraint ttt_win_line_len check (
    winning_line is null or array_length(winning_line, 1) = 3
  )
);

create index if not exists ttt_games_created_at_idx on public.ttt_games (created_at desc);

alter table public.ttt_games enable row level security;

drop policy if exists "ttt_select" on public.ttt_games;
drop policy if exists "ttt_insert" on public.ttt_games;
drop policy if exists "ttt_update" on public.ttt_games;

create policy "ttt_select" on public.ttt_games for select to anon using (true);
create policy "ttt_insert" on public.ttt_games for insert to anon with check (true);
create policy "ttt_update" on public.ttt_games for update to anon using (true) with check (true);

grant usage on schema public to anon;
grant select, insert, update on table public.ttt_games to anon;
