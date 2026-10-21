-- Run once in the Supabase SQL Editor. No demo records or passwords are inserted.
-- Access is denied until authenticated users are explicitly added to farm_members.
begin;
create table if not exists public.farm_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null check (role in ('super_admin', 'admin')),
  active boolean not null default true
);
alter table public.farm_members enable row level security;
drop policy if exists own_membership on public.farm_members;
create policy own_membership on public.farm_members for select to authenticated
  using (user_id = auth.uid());
create or replace function public.is_farm_member() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.farm_members where user_id = auth.uid() and active);
$$;
revoke all on function public.is_farm_member() from public;
grant execute on function public.is_farm_member() to authenticated;
create table if not exists public.workers (
  id text primary key, name text not null, phone text, notes text,
  created_at timestamptz not null default now()
);
create table if not exists public.pineapples (
  id text primary key, name text not null,
  planted_by_worker_id text not null references public.workers(id),
  planted_at timestamptz not null, plant_cost numeric not null check (plant_cost >= 0),
  status text not null check (status in ('active','completed')),
  total_nourishments_required integer not null check (total_nourishments_required > 0),
  interval_hours numeric not null check (interval_hours > 0), completed_at timestamptz, notes text
);
create unique index if not exists single_active_batch on public.pineapples ((status)) where status = 'active';
create table if not exists public.nourishments (
  id text primary key, pineapple_id text not null references public.pineapples(id) on delete cascade,
  worker_id text references public.workers(id), slot_number integer not null check (slot_number > 0),
  due_at timestamptz not null, done_at timestamptz,
  cost numeric not null check (cost >= 0),
  status text not null check (status in ('pending','done','overdue','skipped')), notes text,
  unique(pineapple_id, slot_number)
);
create table if not exists public.payments (
  id text primary key, worker_id text not null references public.workers(id),
  amount numeric not null check (amount > 0), date timestamptz not null, note text
);
create table if not exists public.app_settings (id boolean primary key default true check (id), data jsonb not null);
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(), actor_id uuid not null default auth.uid() references auth.users(id),
  action text not null, details text not null, created_at timestamptz not null default now()
);
do $$ declare t text; begin
  foreach t in array array['workers','pineapples','nourishments','payments','app_settings','audit_logs'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('drop policy if exists member_read on public.%I',t);
    execute format('create policy member_read on public.%I for select to authenticated using (public.is_farm_member())',t);
    -- Writes are intentionally closed until operation-specific permissions and transactions are implemented.
  end loop;
end $$;

-- All record changes are committed together and protected against stale browser overwrites.
create table if not exists public.farm_revision (
  id boolean primary key default true check (id), revision bigint not null default 0
);
insert into public.farm_revision(id) values (true) on conflict do nothing;
alter table public.farm_revision enable row level security;
revoke all on public.farm_revision from anon, authenticated;
revoke all on public.workers, public.pineapples, public.nourishments, public.payments,
  public.app_settings, public.audit_logs from anon, authenticated;
grant select on public.farm_members to authenticated;

create or replace function public.read_farm() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_farm_member() then raise exception 'Active farm membership required' using errcode='42501'; end if;
  return jsonb_build_object(
    'revision', (select revision from public.farm_revision where id),
    'workers', coalesce((select jsonb_agg(w order by created_at desc) from public.workers w),'[]'::jsonb),
    'pineapples', coalesce((select jsonb_agg(p order by planted_at desc) from public.pineapples p),'[]'::jsonb),
    'nourishments', coalesce((select jsonb_agg(n order by pineapple_id,slot_number) from public.nourishments n),'[]'::jsonb),
    'payments', coalesce((select jsonb_agg(p order by date desc) from public.payments p),'[]'::jsonb),
    'settings', coalesce((select data from public.app_settings where id),'{}'::jsonb)
  );
end;
$$;

create or replace function public.save_farm(payload jsonb, expected_revision bigint) returns bigint
language plpgsql security definer set search_path = '' as $$
declare current_revision bigint; section text;
begin
  if not exists(select 1 from public.farm_members where user_id=auth.uid() and active and role='super_admin') then
    raise exception 'Only an active super admin may change farm records' using errcode='42501';
  end if;
  if payload is null or octet_length(payload::text)>2097152 then raise exception 'Invalid or oversized farm data'; end if;
  foreach section in array array['workers','pineapples','nourishments','payments'] loop
    if jsonb_typeof(payload->section) is distinct from 'array' then raise exception 'Invalid % records',section; end if;
  end loop;
  if jsonb_typeof(payload->'settings') is distinct from 'object' then raise exception 'Invalid settings'; end if;
  select revision into current_revision from public.farm_revision where id for update;
  if not exists(select 1 from public.farm_members where user_id=auth.uid() and active and role='super_admin') then
    raise exception 'Farm access changed; please sign in again' using errcode='42501';
  end if;
  if expected_revision is distinct from current_revision then
    raise exception 'Records changed in another session. Download your changes and reload before editing.' using errcode='40001';
  end if;
  delete from public.payments;
  delete from public.nourishments;
  delete from public.pineapples;
  delete from public.workers;
  insert into public.workers select * from jsonb_populate_recordset(null::public.workers,payload->'workers');
  insert into public.pineapples select * from jsonb_populate_recordset(null::public.pineapples,payload->'pineapples');
  insert into public.nourishments select * from jsonb_populate_recordset(null::public.nourishments,payload->'nourishments');
  insert into public.payments select * from jsonb_populate_recordset(null::public.payments,payload->'payments');
  if exists(select 1 from public.nourishments n join public.pineapples p on p.id=n.pineapple_id
    where n.slot_number>p.total_nourishments_required or (n.status='done' and (n.done_at is null or n.worker_id is null))) then
    raise exception 'Invalid nourishment slot or missing completion details';
  end if;
  if exists(select 1 from public.pineapples p where p.total_nourishments_required <>
    (select count(*) from public.nourishments n where n.pineapple_id=p.id)) then
    raise exception 'Each batch must contain its full nourishment schedule';
  end if;
  if exists(select 1 from public.pineapples p where p.status='completed' and p.total_nourishments_required <>
    (select count(*) from public.nourishments n where n.pineapple_id=p.id and n.status='done')) then
    raise exception 'Complete every nourishment slot before completing a batch';
  end if;
  insert into public.app_settings(id,data) values (true,payload->'settings') on conflict(id) do update set data=excluded.data;
  update public.farm_revision set revision=revision+1 where id returning revision into current_revision;
  insert into public.audit_logs(action,details) values ('SAVE_FARM','Farm data committed, revision '||current_revision);
  return current_revision;
end;
$$;
revoke all on function public.read_farm() from public;
revoke all on function public.save_farm(jsonb,bigint) from public;
grant execute on function public.read_farm() to authenticated;
grant execute on function public.save_farm(jsonb,bigint) to authenticated;
create or replace function public.list_farm_members() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not exists(select 1 from public.farm_members where user_id=auth.uid() and active and role='super_admin') then
    raise exception 'Super admin access required' using errcode='42501';
  end if;
  return coalesce((select jsonb_agg(jsonb_build_object('user_id',m.user_id,'name',m.name,'email',u.email,'role',m.role,'active',m.active) order by m.name)
    from public.farm_members m join auth.users u on u.id=m.user_id),'[]'::jsonb);
end;
$$;
create or replace function public.set_farm_member(member_email text, member_name text, member_role text, member_active boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare target_id uuid;
begin
  -- Serialize membership edits and farm writes to avoid changing access mid-transaction.
  perform 1 from public.farm_revision where id for update;
  if not exists(select 1 from public.farm_members where user_id=auth.uid() and active and role='super_admin') then
    raise exception 'Super admin access required' using errcode='42501';
  end if;
  select id into target_id from auth.users where lower(email)=lower(trim(member_email));
  if target_id is null then raise exception 'Invite or create this user in Supabase Authentication first'; end if;
  if target_id=auth.uid() then raise exception 'You cannot change your own farm access'; end if;
  if member_role not in ('admin','super_admin') or length(trim(member_name))=0 then raise exception 'Invalid member details'; end if;
  insert into public.farm_members(user_id,name,role,active) values(target_id,trim(member_name),member_role,member_active)
    on conflict(user_id) do update set name=excluded.name,role=excluded.role,active=excluded.active;
  insert into public.audit_logs(action,details) values ('UPDATE_MEMBER','Updated farm access for user '||target_id);
end;
$$;
revoke all on function public.list_farm_members() from public;
revoke all on function public.set_farm_member(text,text,text,boolean) from public;
grant execute on function public.list_farm_members() to authenticated;
grant execute on function public.set_farm_member(text,text,text,boolean) to authenticated;
commit;
