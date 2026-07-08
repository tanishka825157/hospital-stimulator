-- ============================================================
-- Hospital Emergency Simulator v2 — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. PROFILES TABLE
--    Stores each user's role (admin or patient).
--    Keyed by auth.users.id so it's always linked to a real auth account.
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role text not null check (role in ('admin', 'patient')),
  display_name text,
  created_at timestamptz default now()
);

-- 2. SIMULATION STATE TABLE
--    Single-row table (id = 1) — admin writes full snapshot JSON here.
--    Patients subscribe to Realtime changes on this row.
create table if not exists public.simulation_state (
  id integer primary key default 1,
  snapshot jsonb default '{}'::jsonb,
  session_active boolean default false,
  updated_at timestamptz default now()
);

-- Seed the single row so admin can UPDATE (not INSERT) later
insert into public.simulation_state (id, snapshot, session_active)
values (1, '{}'::jsonb, false)
on conflict (id) do nothing;

-- 3. ROW LEVEL SECURITY
alter table public.profiles enable row level security;
alter table public.simulation_state enable row level security;

-- Users can read their own profile
create policy "profiles: read own"
  on public.profiles for select
  using (auth.uid() = id);

-- Admin can read any profile (to verify roles)
create policy "profiles: admin read all"
  on public.profiles for select
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Any authenticated user can read simulation state (patients watch the live feed)
create policy "simulation_state: anyone read"
  on public.simulation_state for select
  using (auth.role() = 'authenticated');

-- Only admin can write simulation state
create policy "simulation_state: admin update"
  on public.simulation_state for update
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- 4. TRIGGER: auto-create profile on new auth user signup
--    New users get role 'patient' by default.
--    To create an admin, manually set role = 'admin' in the Supabase dashboard.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'patient'),
    coalesce(new.raw_user_meta_data->>'display_name', new.email)
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. REALTIME — enable Realtime on simulation_state
--    Go to Supabase Dashboard → Database → Replication
--    and enable simulation_state for Realtime (or run below):
alter publication supabase_realtime add table public.simulation_state;

-- ============================================================
-- TO CREATE AN ADMIN ACCOUNT:
-- 1. Sign up normally via the app (creates a 'patient' profile)
-- 2. In Supabase Dashboard → Table Editor → profiles
--    find your user row and change role to 'admin'
-- OR: Create admin directly here:
-- insert into auth.users ... (complex — easier to use dashboard)
-- ============================================================
