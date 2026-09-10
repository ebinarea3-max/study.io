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
  total_study_seconds bigint default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Subjects Table
create table if not exists public.subjects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  color text not null default '#10B981',
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

-- ====================================================================
-- Row-Level Security (RLS) Policies
-- ====================================================================

alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.study_sessions enable row level security;
alter table public.todos enable row level security;
alter table public.room_presence enable row level security;

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

-- ====================================================================
-- Realtime Publication & User Trigger
-- ====================================================================

-- Add room_presence to Supabase Realtime publication
alter publication supabase_realtime add table public.room_presence;

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
