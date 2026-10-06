-- ====================================================================
-- StudyPulse - Complete Supabase Database Schema & Row-Level Security
-- ====================================================================

-- 1. Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  avatar_url text,
  daily_goal_hours numeric default 4.0,
  streak_days integer default 0,
  level integer default 1,
  xp bigint default 0,
  total_study_seconds bigint default 0,
  current_season_id text default to_char(now(), 'YYYY-MM'),
  season_rp integer default 0,
  last_streak_bonus_date text default null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Migration for existing instances:
alter table public.profiles add column if not exists current_season_id text default to_char(now(), 'YYYY-MM');
alter table public.profiles add column if not exists season_rp integer default 0;
alter table public.profiles add column if not exists lifetime_xp bigint default 0;
alter table public.profiles add column if not exists last_streak_bonus_date text default null;
alter table public.subjects add column if not exists is_archived boolean default false;

-- 2. Subjects Table
create table if not exists public.subjects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  color text not null default '#10B981',
  is_archived boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Study Sessions Table (Permanent records when timer stops)
create table if not exists public.study_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  subject_id uuid references public.subjects(id) on delete set null,
  duration_seconds integer not null,
  started_at timestamp with time zone not null,
  ended_at timestamp with time zone not null,
  notes text,
  mode text default 'stopwatch',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Todos / Tasks Table
create table if not exists public.todos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  task text not null,
  is_completed boolean default false,
  due_date date not null default current_date,
  priority text default 'medium',
  estimated_minutes integer default 30,
  subject_id uuid references public.subjects(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Room Presence Table (Realtime study status sync across peers)
create table if not exists public.room_presence (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  room_id text not null,
  is_studying boolean default false,
  subject_name text,
  session_start_time timestamp with time zone,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, room_id)
);

-- 6. Active Sessions Table (Live Multi-Device Timer Sync)
create table if not exists public.active_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  status text not null default 'idle' 
    check (status in ('idle', 'running', 'paused', 'stopped')),
  mode text check (mode in ('stopwatch', 'pomodoro')),
  subject_id uuid references public.subjects(id) on delete set null,
  started_at timestamptz,
  accumulated_seconds int not null default 0,
  pomodoro_phase text check (pomodoro_phase in ('focus', 'break')),
  pomodoro_duration_seconds int,
  device_id text,
  updated_at timestamptz not null default now()
);

-- Auto-update updated_at on every change
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_active_sessions_updated_at on public.active_sessions;
create trigger trg_active_sessions_updated_at
before update on public.active_sessions
for each row execute function public.set_updated_at();

-- Drop obsolete overloaded functions if any exist
drop function if exists public.pause_session(uuid, text);
drop function if exists public.stop_session(uuid, text, text);
drop function if exists public.stop_session(uuid, text);
drop function if exists public.resume_session(uuid, text);

-- RPC: pause_session (Server-authoritative pause)
create or replace function public.pause_session(p_device_id text)
returns void as $$
begin
  update public.active_sessions
  set accumulated_seconds = accumulated_seconds + 
        extract(epoch from (now() - started_at))::int,
      status = 'paused',
      started_at = null,
      device_id = p_device_id
  where user_id = auth.uid() and status = 'running';
end;
$$ language plpgsql security definer;

-- RPC: stop_session (Server-authoritative stop returning final accumulated seconds)
create or replace function public.stop_session(p_device_id text)
returns int as $$
declare
  final_seconds int;
begin
  update public.active_sessions
  set accumulated_seconds = accumulated_seconds + 
        coalesce(extract(epoch from (now() - started_at))::int, 0),
      status = 'stopped',
      started_at = null,
      device_id = p_device_id
  where user_id = auth.uid() and status in ('running', 'paused')
  returning accumulated_seconds into final_seconds;

  -- Reset back to idle after capturing the final duration
  update public.active_sessions
  set status = 'idle', accumulated_seconds = 0, subject_id = null
  where user_id = auth.uid();

  return final_seconds;
end;
$$ language plpgsql security definer;

-- ====================================================================
-- Row-Level Security (RLS) Policies
-- ====================================================================

alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.study_sessions enable row level security;
alter table public.todos enable row level security;
alter table public.room_presence enable row level security;
alter table public.active_sessions enable row level security;

-- Profiles: Public can read, users can update own profile
create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Subjects: Users only manage their own subjects
create policy "Users can view own subjects"
  on public.subjects for select using (auth.uid() = user_id);

create policy "Users can insert own subjects"
  on public.subjects for insert with check (auth.uid() = user_id);

create policy "Users can update own subjects"
  on public.subjects for update using (auth.uid() = user_id);

create policy "Users can delete own subjects"
  on public.subjects for delete using (auth.uid() = user_id);

-- Study Sessions: Users only manage their own sessions
create policy "Users can view own study sessions"
  on public.study_sessions for select using (auth.uid() = user_id);

create policy "Users can insert own study sessions"
  on public.study_sessions for insert with check (auth.uid() = user_id);

create policy "Users can delete own study sessions"
  on public.study_sessions for delete using (auth.uid() = user_id);

-- Todos: Users only manage their own todos
create policy "Users can view own todos"
  on public.todos for select using (auth.uid() = user_id);

create policy "Users can insert own todos"
  on public.todos for insert with check (auth.uid() = user_id);

create policy "Users can update own todos"
  on public.todos for update using (auth.uid() = user_id);

create policy "Users can delete own todos"
  on public.todos for delete using (auth.uid() = user_id);

-- Room Presence: Public can view active members; users update own presence
create policy "Room presence viewable by everyone"
  on public.room_presence for select using (true);

create policy "Users can insert own room presence"
  on public.room_presence for insert with check (auth.uid() = user_id);

create policy "Users can update own room presence"
  on public.room_presence for update using (auth.uid() = user_id);

create policy "Users can delete own room presence"
  on public.room_presence for delete using (auth.uid() = user_id);

-- Active Sessions: Users only manage their own active live timer session
create policy "Users can view own active session"
  on public.active_sessions for select using (auth.uid() = user_id);

create policy "Users can insert own active session"
  on public.active_sessions for insert with check (auth.uid() = user_id);

create policy "Users can update own active session"
  on public.active_sessions for update using (auth.uid() = user_id);

create policy "Users can delete own active session"
  on public.active_sessions for delete using (auth.uid() = user_id);

-- ====================================================================
-- Realtime Publication & User Trigger
-- ====================================================================

-- Add room_presence and active_sessions to Supabase Realtime publication
alter table public.active_sessions replica identity full;
alter publication supabase_realtime add table public.room_presence;
alter publication supabase_realtime add table public.active_sessions;

-- Automatically create profile row when new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, avatar_url, created_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', null),
    now()
  )
  on conflict (id) do update set
    name = coalesce(excluded.name, profiles.name),
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ====================================================================
-- Model 2 Monthly Rank Soft-Reset RPC Function
-- ====================================================================

-- Migration columns for rank soft-reset tracking
alter table public.profiles add column if not exists rp integer default 0;
alter table public.profiles add column if not exists rank_title text default 'Bronze I';
alter table public.profiles add column if not exists season_base_rp integer default 0;
alter table public.profiles add column if not exists current_season_id text default to_char(now(), 'YYYY-MM');

-- RPC: check_and_apply_season_reset()
create or replace function public.check_and_apply_season_reset()
returns jsonb
language plpgsql
security definer
as $$
declare
  current_user_id uuid;
  user_profile record;
  current_month text;
  current_month_name text;
  prev_rp integer;
  prev_rank text;
  new_rank text;
  starting_rp integer;
begin
  -- Resolve calling authenticated user
  current_user_id := auth.uid();
  if current_user_id is null then
    return jsonb_build_object('needs_reset', false, 'error', 'Not authenticated');
  end if;

  -- Get current user profile
  select * into user_profile from public.profiles where id = current_user_id;
  if not found then
    return jsonb_build_object('needs_reset', false, 'error', 'Profile not found');
  end if;

  current_month := to_char(now(), 'YYYY-MM');
  current_month_name := trim(to_char(now(), 'Month'));

  -- If user has no current_season_id, initialize it
  if user_profile.current_season_id is null then
    update public.profiles
    set current_season_id = current_month,
        rp = coalesce(rp, season_rp, 0),
        season_rp = coalesce(season_rp, rp, 0),
        season_base_rp = coalesce(season_base_rp, 0),
        rank_title = coalesce(rank_title, 'Bronze I')
    where id = current_user_id;
    return jsonb_build_object('needs_reset', false);
  end if;

  -- If already in current season, no reset needed
  if user_profile.current_season_id = current_month then
    return jsonb_build_object('needs_reset', false);
  end if;

  -- Season rollover detected! Determine Model 2 soft reset thresholds:
  prev_rp := coalesce(user_profile.season_rp, user_profile.rp, 0);

  -- Determine previous rank title
  if prev_rp >= 18000 then
    prev_rank := 'Grandmaster';
  elsif prev_rp >= 16200 then
    prev_rank := 'Master';
  elsif prev_rp >= 14400 then
    prev_rank := 'Champion';
  elsif prev_rp >= 12900 then
    prev_rank := 'Diamond IV';
  elsif prev_rp >= 11700 then
    prev_rank := 'Diamond III';
  elsif prev_rp >= 10500 then
    prev_rank := 'Diamond II';
  elsif prev_rp >= 9300 then
    prev_rank := 'Diamond I';
  elsif prev_rp >= 8100 then
    prev_rank := 'Platinum IV';
  elsif prev_rp >= 7200 then
    prev_rank := 'Platinum III';
  elsif prev_rp >= 6300 then
    prev_rank := 'Platinum II';
  elsif prev_rp >= 5400 then
    prev_rank := 'Platinum I';
  elsif prev_rp >= 4560 then
    prev_rank := 'Gold IV';
  elsif prev_rp >= 3900 then
    prev_rank := 'Gold III';
  elsif prev_rp >= 3300 then
    prev_rank := 'Gold II';
  elsif prev_rp >= 2700 then
    prev_rank := 'Gold I';
  elsif prev_rp >= 2160 then
    prev_rank := 'Silver IV';
  elsif prev_rp >= 1800 then
    prev_rank := 'Silver III';
  elsif prev_rp >= 1260 then
    prev_rank := 'Silver II';
  elsif prev_rp >= 900 then
    prev_rank := 'Silver I';
  elsif prev_rp >= 600 then
    prev_rank := 'Bronze IV';
  elsif prev_rp >= 360 then
    prev_rank := 'Bronze III';
  elsif prev_rp >= 180 then
    prev_rank := 'Bronze II';
  else
    prev_rank := 'Bronze I';
  end if;

  -- Model 2 Monthly Soft-Reset Rules:
  -- - Grandmaster / Master / Champion (>= 14400 RP) -> Gold II (3,300 RP)
  -- - Diamond I-IV (9300-12900 RP) -> Gold I (2,700 RP)
  -- - Platinum I-IV (5400-8100 RP) -> Silver II (1,260 RP)
  -- - Gold I-IV (2700-4560 RP) -> Silver I (900 RP)
  -- - Silver I-IV (900-2160 RP) -> Bronze II (180 RP)
  -- - Bronze I-IV (0-600 RP) -> Bronze I (0 RP)
  if prev_rp >= 14400 then
    new_rank := 'Gold II';
    starting_rp := 3300;
  elsif prev_rp >= 9300 then
    new_rank := 'Gold I';
    starting_rp := 2700;
  elsif prev_rp >= 5400 then
    new_rank := 'Silver II';
    starting_rp := 1260;
  elsif prev_rp >= 2700 then
    new_rank := 'Silver I';
    starting_rp := 900;
  elsif prev_rp >= 900 then
    new_rank := 'Bronze II';
    starting_rp := 180;
  else
    new_rank := 'Bronze I';
    starting_rp := 0;
  end if;

  -- Apply soft-reset mutations to profile
  update public.profiles
  set current_season_id = current_month,
      season_rp = starting_rp,
      rp = starting_rp,
      season_base_rp = starting_rp,
      rank_title = new_rank
  where id = current_user_id;

  -- Return payload
  return jsonb_build_object(
    'needs_reset', true,
    'previous_rank', prev_rank,
    'new_rank', new_rank,
    'starting_rp', starting_rp,
    'month_name', current_month_name
  );
end;
$$;

-- ====================================================================
-- 8. Monthly Leaderboard RPC
-- Calculates total focus seconds logged in the current calendar month
-- ====================================================================
create or replace function public.get_monthly_leaderboard()
returns table (
  rank_position bigint,
  user_id uuid,
  display_name text,
  username text,
  lifetime_xp bigint,
  rank_title text,
  total_seconds bigint,
  is_current_user boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  curr_user_id uuid := auth.uid();
  month_start timestamp with time zone := date_trunc('month', now());
begin
  return query
  with monthly_stats as (
    select
      s.user_id,
      coalesce(sum(s.duration_seconds), 0)::bigint as total_seconds
    from public.study_sessions s
    where s.started_at >= month_start
    group by s.user_id
  )
  select
    row_number() over (order by coalesce(m.total_seconds, 0) desc, coalesce(p.lifetime_xp, 0) desc)::bigint as rank_position,
    p.id as user_id,
    coalesce(nullif(p.name, ''), 'Anonymous Scholar') as display_name,
    coalesce(nullif(p.username, ''), split_part(coalesce(nullif(p.name, ''), 'user'), ' ', 1)) as username,
    coalesce(p.lifetime_xp, p.xp, 0)::bigint as lifetime_xp,
    coalesce(p.rank_title, 'BRONZE I') as rank_title,
    coalesce(m.total_seconds, 0)::bigint as total_seconds,
    (curr_user_id is not null and p.id = curr_user_id) as is_current_user
  from monthly_stats m
  join public.profiles p on p.id = m.user_id
  where m.total_seconds > 0
  order by rank_position asc;
end;
$$;

-- ====================================================================
-- 9. General Timeframe Leaderboard RPC
-- Calculates focus seconds filtered by timeframe: 'today' | 'week' | 'month' | 'all'
-- ====================================================================
create or replace function public.get_leaderboard(timeframe text default 'month')
returns table (
  rank_position bigint,
  user_id uuid,
  display_name text,
  username text,
  lifetime_xp bigint,
  rank_title text,
  total_seconds bigint,
  is_current_user boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  curr_user_id uuid := auth.uid();
  filter_start timestamp with time zone;
begin
  if timeframe = 'today' then
    filter_start := date_trunc('day', now());
  elsif timeframe = 'week' then
    filter_start := date_trunc('week', now());
  elsif timeframe = 'month' then
    filter_start := date_trunc('month', now());
  else
    filter_start := null;
  end if;

  return query
  with period_stats as (
    select
      s.user_id,
      coalesce(sum(s.duration_seconds), 0)::bigint as total_seconds
    from public.study_sessions s
    where (filter_start is null or s.started_at >= filter_start)
    group by s.user_id
  )
  select
    row_number() over (order by coalesce(m.total_seconds, 0) desc, coalesce(p.lifetime_xp, 0) desc)::bigint as rank_position,
    p.id as user_id,
    coalesce(nullif(p.name, ''), 'Anonymous Scholar') as display_name,
    coalesce(nullif(p.username, ''), split_part(coalesce(nullif(p.name, ''), 'user'), ' ', 1)) as username,
    coalesce(p.lifetime_xp, p.xp, 0)::bigint as lifetime_xp,
    coalesce(p.rank_title, 'BRONZE I') as rank_title,
    coalesce(m.total_seconds, 0)::bigint as total_seconds,
    (curr_user_id is not null and p.id = curr_user_id) as is_current_user
  from period_stats m
  join public.profiles p on p.id = m.user_id
  where m.total_seconds > 0
  order by rank_position asc;
end;
$$;


C R E A T E   U N I Q U E   I N D E X   I F   N O T   E X I S T S   u n i q u e _ u s e r _ s u b j e c t _ n a m e   O N   p u b l i c . s u b j e c t s   ( u s e r _ i d ,   L O W E R ( T R I M ( n a m e ) ) ) ;  
 