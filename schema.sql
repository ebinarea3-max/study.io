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
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null unique,
  subject_id uuid references public.subjects(id) on delete set null,
  subject_name text,
  status text not null default 'idle' check (status in ('idle', 'running', 'paused', 'stopped')),
  started_at timestamp with time zone,
  paused_at timestamp with time zone,
  accumulated_seconds integer not null default 0,
  mode text not null default 'stopwatch' check (mode in ('stopwatch', 'pomodoro')),
  pomodoro_phase text check (pomodoro_phase in ('focus', 'work', 'break', 'shortBreak')),
  pomodoro_duration_seconds integer,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  device_id text
);

-- Migration safety for existing instances
alter table public.active_sessions add column if not exists id uuid default gen_random_uuid();
alter table public.active_sessions add column if not exists mode text default 'stopwatch';
alter table public.active_sessions add column if not exists paused_at timestamp with time zone;
alter table public.active_sessions add column if not exists accumulated_seconds integer default 0;
alter table public.active_sessions add column if not exists pomodoro_phase text default null;
alter table public.active_sessions add column if not exists pomodoro_duration_seconds integer default null;
alter table public.active_sessions add column if not exists device_id text default null;

-- Auto-update updated_at trigger
create or replace function public.set_active_sessions_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_active_sessions_updated_at on public.active_sessions;
create trigger trigger_active_sessions_updated_at
  before update on public.active_sessions
  for each row execute function public.set_active_sessions_updated_at();

-- RPC: pause_session (Atomic, server-calculated accumulated time)
create or replace function public.pause_session(p_user_id uuid, p_device_id text)
returns void as $$
  update public.active_sessions
  set accumulated_seconds = accumulated_seconds + 
      coalesce(greatest(0, extract(epoch from (now() - started_at))::int), 0),
      status = 'paused',
      paused_at = now(),
      started_at = null,
      device_id = p_device_id
  where user_id = p_user_id and status = 'running';
$$ language sql security definer;

-- RPC: resume_session (Guarded transition from paused to running)
create or replace function public.resume_session(p_user_id uuid, p_device_id text)
returns void as $$
  update public.active_sessions
  set status = 'running',
      started_at = now(),
      paused_at = null,
      device_id = p_device_id
  where user_id = p_user_id and status = 'paused';
$$ language sql security definer;

-- RPC: stop_session (Finalizes elapsed, writes study_sessions history, resets active_sessions)
create or replace function public.stop_session(
  p_user_id uuid,
  p_device_id text,
  p_notes text default null
)
returns void as $$
declare
  v_session record;
  v_final_seconds int;
begin
  select * into v_session from public.active_sessions where user_id = p_user_id and status in ('running', 'paused');
  if found then
    if v_session.status = 'running' and v_session.started_at is not null then
      v_final_seconds := coalesce(v_session.accumulated_seconds, 0) + greatest(0, extract(epoch from (now() - v_session.started_at))::int);
    else
      v_final_seconds := coalesce(v_session.accumulated_seconds, 0);
    end if;

    if v_final_seconds > 0 then
      insert into public.study_sessions (
        user_id,
        subject_id,
        duration_seconds,
        started_at,
        ended_at,
        notes,
        mode,
        created_at
      ) values (
        p_user_id,
        v_session.subject_id,
        v_final_seconds,
        coalesce(v_session.started_at, now() - (v_final_seconds || ' seconds')::interval),
        now(),
        coalesce(p_notes, ''),
        coalesce(v_session.mode, 'stopwatch'),
        now()
      );
    end if;

    update public.active_sessions
    set status = 'stopped',
        started_at = null,
        paused_at = null,
        accumulated_seconds = 0,
        subject_id = null,
        device_id = p_device_id
    where user_id = p_user_id;
  end if;
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
