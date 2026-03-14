-- Create a table to persist user-localStorage data across devices
-- Run this in your Supabase SQL editor (or via `supabase` CLI migrations).

create table if not exists public.user_data (
  user_id uuid not null references auth.users(id) on delete cascade,
  data_key text not null,
  data_value text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, data_key)
);

-- Ensure only the signed-in user can read/write their own data
alter table public.user_data enable row level security;

create policy "users can manage their own data" on public.user_data
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
