-- ==============================================================================
-- 🐮💪 MOOSCLES — Schéma de production
-- Challenge : 19 Octobre → 17 Décembre 2026
-- Chaque membre a un compte Supabase Auth. Seuls les membres du groupe
-- (qui ont rejoint avec le code d'invitation) peuvent lire/écrire.
-- ==============================================================================

create schema if not exists private;

-- ------------------------------------------------------------------------------
-- Config privée (code d'invitation, clés push). Jamais exposée via l'API.
-- ------------------------------------------------------------------------------
create table if not exists private.app_config (
  key text primary key,
  value text not null
);

-- ------------------------------------------------------------------------------
-- 1. Profils (1 par compte)
-- ------------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 30),
  avatar text not null default '🐮' check (char_length(avatar) <= 16),
  color text not null default '#f59e0b' check (color ~ '^#[0-9a-fA-F]{6}$'),
  role text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 2. Saisies quotidiennes
-- ------------------------------------------------------------------------------
create table public.daily_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  date date not null check (date between '2026-10-19' and '2026-12-17'),
  pushups integer not null default 0 check (pushups between 0 and 5000),
  squats integer not null default 0 check (squats between 0 and 5000),
  plank_seconds integer not null default 0 check (plank_seconds between 0 and 36000),
  notes text,
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

-- ------------------------------------------------------------------------------
-- 3. Bilans hebdo (sondage du lundi) & amendes. Amende = 5 - score.
-- ------------------------------------------------------------------------------
create table public.weekly_settlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  week_number integer not null check (week_number between 1 and 9),
  year integer not null default 2026,
  score integer not null check (score between 0 and 5),
  fine_amount numeric(4, 2) generated always as (5 - score) stored,
  is_paid boolean not null default false,
  paid_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, week_number, year)
);

-- ------------------------------------------------------------------------------
-- 4. Idées pour la cagnotte + votes
-- ------------------------------------------------------------------------------
create table public.cagnotte_ideas (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  description text check (char_length(description) <= 1000),
  suggested_by uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.idea_votes (
  idea_id uuid not null references public.cagnotte_ideas(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (idea_id, user_id)
);

-- ------------------------------------------------------------------------------
-- 5. Abonnements aux notifications push (rappel 19h)
-- ------------------------------------------------------------------------------
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

-- Index
create index idx_entries_date on public.daily_entries(date);
create index idx_settlements_user on public.weekly_settlements(user_id);
create index idx_ideas_suggested_by on public.cagnotte_ideas(suggested_by);
create index idx_votes_user on public.idea_votes(user_id);
create index idx_push_user on public.push_subscriptions(user_id);

-- ------------------------------------------------------------------------------
-- Fonctions utilitaires (schéma privé, non exposé)
-- ------------------------------------------------------------------------------
create or replace function private.is_member()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()));
$$;

create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;

grant usage on schema private to authenticated;
grant execute on function private.is_member() to authenticated;
grant execute on function private.is_admin() to authenticated;

-- updated_at automatique
create or replace function private.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_entries_touch before update on public.daily_entries
  for each row execute function private.touch_updated_at();

-- Seul l'admin (trésorier) peut marquer une amende comme payée.
create or replace function private.guard_settlement()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  caller_is_admin boolean := private.is_admin();
begin
  new.updated_at := now();
  if tg_op = 'INSERT' then
    if not caller_is_admin then
      new.is_paid := (new.score = 5);
    end if;
  else
    if not caller_is_admin then
      new.is_paid := old.is_paid;
      new.paid_at := old.paid_at;
      -- un membre ne change que son propre score
      new.user_id := old.user_id;
    end if;
    if new.score = 5 then
      new.is_paid := true;
    end if;
  end if;
  if new.is_paid and new.paid_at is null then
    new.paid_at := now();
  elsif not new.is_paid then
    new.paid_at := null;
  end if;
  return new;
end;
$$;

create trigger trg_settlement_guard before insert or update on public.weekly_settlements
  for each row execute function private.guard_settlement();

-- ------------------------------------------------------------------------------
-- Rejoindre le challenge avec le code d'invitation.
-- Le tout premier inscrit devient admin (trésorier de la cagnotte).
-- ------------------------------------------------------------------------------
create or replace function public.join_challenge(p_code text, p_name text, p_avatar text, p_color text)
returns public.profiles
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_expected text;
  v_role text;
  v_profile public.profiles;
begin
  if v_uid is null then
    raise exception 'Non connecté';
  end if;

  select value into v_expected from private.app_config where key = 'invite_code';
  if v_expected is null or upper(trim(p_code)) <> upper(v_expected) then
    raise exception 'Code d''invitation invalide';
  end if;

  select case when exists (select 1 from public.profiles) then 'member' else 'admin' end into v_role;

  insert into public.profiles (id, name, avatar, color, role)
  values (v_uid, trim(p_name), coalesce(nullif(p_avatar, ''), '🐮'), coalesce(nullif(p_color, ''), '#f59e0b'), v_role)
  on conflict (id) do update set name = excluded.name, avatar = excluded.avatar, color = excluded.color
  returning * into v_profile;

  return v_profile;
end;
$$;

revoke execute on function public.join_challenge(text, text, text, text) from public, anon;
grant execute on function public.join_challenge(text, text, text, text) to authenticated;

-- Vote du bilan hebdo (crée ou met à jour son propre score)
create or replace function public.submit_weekly_score(p_week integer, p_score integer)
returns public.weekly_settlements
language plpgsql security invoker set search_path = '' as $$
declare
  v_row public.weekly_settlements;
begin
  insert into public.weekly_settlements (user_id, week_number, year, score)
  values (auth.uid(), p_week, 2026, p_score)
  on conflict (user_id, week_number, year) do update set score = excluded.score
  returning * into v_row;
  return v_row;
end;
$$;

revoke execute on function public.submit_weekly_score(integer, integer) from public, anon;
grant execute on function public.submit_weekly_score(integer, integer) to authenticated;

-- ------------------------------------------------------------------------------
-- Droits sur les tables
-- ------------------------------------------------------------------------------
revoke all on public.profiles, public.daily_entries, public.weekly_settlements,
  public.cagnotte_ideas, public.idea_votes, public.push_subscriptions from anon;

-- Un membre ne peut modifier que son nom, avatar et couleur (pas son rôle).
revoke insert, update on public.profiles from authenticated;
grant update (name, avatar, color) on public.profiles to authenticated;

-- fine_amount est calculée par la base
revoke insert, update on public.weekly_settlements from authenticated;
grant insert (user_id, week_number, year, score, is_paid, paid_at) on public.weekly_settlements to authenticated;
grant update (score, is_paid, paid_at) on public.weekly_settlements to authenticated;

-- ------------------------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.daily_entries enable row level security;
alter table public.weekly_settlements enable row level security;
alter table public.cagnotte_ideas enable row level security;
alter table public.idea_votes enable row level security;
alter table public.push_subscriptions enable row level security;

-- Profils
create policy "profiles_select_members" on public.profiles for select to authenticated
  using ((select private.is_member()));
create policy "profiles_update_self" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "profiles_delete_admin" on public.profiles for delete to authenticated
  using ((select private.is_admin()) and id <> (select auth.uid()));

-- Saisies
create policy "entries_select_members" on public.daily_entries for select to authenticated
  using ((select private.is_member()));
create policy "entries_insert_own" on public.daily_entries for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "entries_update_own" on public.daily_entries for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "entries_delete_own" on public.daily_entries for delete to authenticated
  using (user_id = (select auth.uid()));

-- Bilans
create policy "settlements_select_members" on public.weekly_settlements for select to authenticated
  using ((select private.is_member()));
create policy "settlements_insert_own" on public.weekly_settlements for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "settlements_update_own_or_admin" on public.weekly_settlements for update to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()))
  with check (user_id = (select auth.uid()) or (select private.is_admin()));

-- Idées
create policy "ideas_select_members" on public.cagnotte_ideas for select to authenticated
  using ((select private.is_member()));
create policy "ideas_insert_members" on public.cagnotte_ideas for insert to authenticated
  with check (suggested_by = (select auth.uid()));
create policy "ideas_delete_own_or_admin" on public.cagnotte_ideas for delete to authenticated
  using (suggested_by = (select auth.uid()) or (select private.is_admin()));

-- Votes
create policy "votes_select_members" on public.idea_votes for select to authenticated
  using ((select private.is_member()));
create policy "votes_insert_own" on public.idea_votes for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "votes_delete_own" on public.idea_votes for delete to authenticated
  using (user_id = (select auth.uid()));

-- Push : chacun ne voit que ses propres appareils
create policy "push_select_own" on public.push_subscriptions for select to authenticated
  using (user_id = (select auth.uid()));
create policy "push_insert_own" on public.push_subscriptions for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "push_update_own" on public.push_subscriptions for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "push_delete_own" on public.push_subscriptions for delete to authenticated
  using (user_id = (select auth.uid()));

-- ------------------------------------------------------------------------------
-- Temps réel (le classement se met à jour tout seul)
-- ------------------------------------------------------------------------------
alter publication supabase_realtime add table public.daily_entries, public.weekly_settlements,
  public.cagnotte_ideas, public.idea_votes, public.profiles;
