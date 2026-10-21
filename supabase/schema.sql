-- Run once in the Supabase SQL Editor. No demo records or passwords are inserted.
-- Access is denied until authenticated users are explicitly added to farm_members.
begin;
create table public.farm_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null check (role in ('super_admin', 'admin')),
  active boolean not null default true
);
alter table public.farm_members enable row level security;
create policy own_membership on public.farm_members for select to authenticated
  using (user_id = auth.uid());
create function public.is_farm_member() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.farm_members where user_id = auth.uid() and active);
$$;
revoke all on function public.is_farm_member() from public;
grant execute on function public.is_farm_member() to authenticated;
create table public.workers (
  id text primary key, name text not null, phone text, notes text,
  created_at timestamptz not null default now()
);
create table public.pineapples (
  id text primary key, name text not null,
  planted_by_worker_id text not null references public.workers(id),
  planted_at timestamptz not null, plant_cost numeric not null check (plant_cost >= 0),
  status text not null check (status in ('active','completed')),
  total_nourishments_required integer not null check (total_nourishments_required > 0),
  interval_hours numeric not null check (interval_hours > 0), completed_at timestamptz, notes text
);
create unique index single_active_batch on public.pineapples ((status)) where status = 'active';
create table public.nourishments (
  id text primary key, pineapple_id text not null references public.pineapples(id) on delete cascade,
  worker_id text references public.workers(id), slot_number integer not null check (slot_number > 0),
  due_at timestamptz not null, done_at timestamptz,
  cost numeric not null check (cost >= 0),
  status text not null check (status in ('pending','done','overdue','skipped')), notes text,
  unique(pineapple_id, slot_number)
);
create table public.payments (
  id text primary key, worker_id text not null references public.workers(id),
  amount numeric not null check (amount > 0), date timestamptz not null, note text
);
create table public.app_settings (id boolean primary key default true check (id), data jsonb not null);
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(), actor_id uuid not null default auth.uid() references auth.users(id),
  action text not null, details text not null, created_at timestamptz not null default now()
);
do $$ declare t text; begin
  foreach t in array array['workers','pineapples','nourishments','payments','app_settings','audit_logs'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('create policy member_read on public.%I for select to authenticated using (public.is_farm_member())',t);
    -- Writes are intentionally closed until operation-specific permissions and transactions are implemented.
  end loop;
end $$;
commit;
