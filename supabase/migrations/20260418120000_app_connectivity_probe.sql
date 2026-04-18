-- One-row table for browser connectivity checks (RLS: SELECT for Postgres role anon).
-- Run this file once on your hosted project: Supabase Dashboard → SQL Editor → New query → paste → Run.

create table if not exists public.app_connectivity_probe (
  id smallint primary key check (id = 1),
  status text not null default 'ok'
);

insert into public.app_connectivity_probe (id, status)
values (1, 'ok')
on conflict (id) do nothing;

alter table public.app_connectivity_probe enable row level security;

drop policy if exists "anon_select_app_connectivity_probe" on public.app_connectivity_probe;

create policy "anon_select_app_connectivity_probe"
  on public.app_connectivity_probe
  for select
  to anon
  using (true);

grant usage on schema public to anon;
grant select on table public.app_connectivity_probe to anon;
