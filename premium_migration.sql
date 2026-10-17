-- ====================================================================
-- study.io Premium Migration
-- Adds subscriptions table, RLS policies, and entitlement/insights RPCs
-- ====================================================================

-- 1. Subscriptions Table
create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null default 'razorpay',
  provider_subscription_id text unique,
  plan text check (plan in ('monthly','yearly')),
  status text not null default 'none',
  premium_until timestamptz,
  cancel_at_cycle_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Row Level Security on subscriptions
alter table public.subscriptions enable row level security;

-- Drop policy if already exists to ensure idempotent re-runs
drop policy if exists "read own subscription" on public.subscriptions;
create policy "read own subscription" on public.subscriptions
  for select using (auth.uid() = user_id);

-- No insert, update or delete policies. Only the server and the SQL editor can write.

-- 3. Entitlements RPC
create or replace function public.get_my_entitlements()
returns table (is_premium boolean, premium_until timestamptz, plan text,
               status text, cancel_at_cycle_end boolean)
language sql security definer set search_path = public as $$
  select coalesce(s.premium_until > now(), false), s.premium_until, s.plan,
         s.status, coalesce(s.cancel_at_cycle_end, false)
  from (select 1) d left join subscriptions s on s.user_id = auth.uid();
$$;

revoke all on function public.get_my_entitlements() from public;
grant execute on function public.get_my_entitlements() to authenticated;

-- 4. Insights RPC
-- Note: Verified column names on public.study_sessions:
-- user_id (uuid), started_at (timestamptz), duration_seconds (int)
create or replace function public.get_my_insights(p_tz text default 'UTC')
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_premium boolean;
  v_result jsonb;
begin
  select coalesce(s.premium_until > now(), false) into v_premium
  from subscriptions s where s.user_id = auth.uid();
  if not coalesce(v_premium, false) then
    raise exception 'premium_required' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'by_weekday', coalesce((select jsonb_object_agg(k, secs) from (
      select extract(isodow from started_at at time zone p_tz)::int as k,
             coalesce(sum(duration_seconds),0)::bigint as secs
      from study_sessions where user_id = auth.uid() group by 1) w), '{}'::jsonb),
    'by_hour', coalesce((select jsonb_object_agg(k, secs) from (
      select extract(hour from started_at at time zone p_tz)::int as k,
             coalesce(sum(duration_seconds),0)::bigint as secs
      from study_sessions where user_id = auth.uid() group by 1) h), '{}'::jsonb),
    'by_day', coalesce((select jsonb_object_agg(k, secs) from (
      select to_char((started_at at time zone p_tz)::date, 'YYYY-MM-DD') as k,
             coalesce(sum(duration_seconds),0)::bigint as secs
      from study_sessions
      where user_id = auth.uid() and started_at >= now() - interval '84 days'
      group by 1) x), '{}'::jsonb)
  ) into v_result;

  return v_result;
end $$;

revoke all on function public.get_my_insights(text) from public;
grant execute on function public.get_my_insights(text) to authenticated;

-- ====================================================================
-- 5. Weekly Report RPC (Phase G)
-- Returns this week and last week study telemetry in user's timezone
-- ====================================================================
create or replace function public.get_my_weekly_report(p_tz text default 'UTC')
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_premium boolean;
  v_uid uuid;
  v_now timestamp;
  v_this_week_start timestamp;
  v_last_week_start timestamp;
  v_next_week_start timestamp;
  v_result jsonb;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  -- 1. Enforce premium status on the server
  select coalesce(s.premium_until > now(), false) into v_premium
  from subscriptions s where s.user_id = v_uid;
  if not coalesce(v_premium, false) then
    raise exception 'premium_required' using errcode = '42501';
  end if;

  -- 2. Compute week boundaries in user timezone (Monday to Sunday)
  begin
    v_now := (now() at time zone p_tz);
  exception when others then
    v_now := (now() at time zone 'UTC');
    p_tz := 'UTC';
  end;

  v_this_week_start := date_trunc('week', v_now);
  v_last_week_start := v_this_week_start - interval '7 days';
  v_next_week_start := v_this_week_start + interval '7 days';

  with
  -- Sessions in the 2-week window (last week + this week)
  two_week_sessions as (
    select
      s.id,
      s.duration_seconds,
      s.subject_id,
      (s.started_at at time zone p_tz) as local_started_at,
      extract(isodow from (s.started_at at time zone p_tz))::int as day_of_week,
      case
        when (s.started_at at time zone p_tz) >= v_this_week_start
         and (s.started_at at time zone p_tz) < v_next_week_start then 'this_week'
        when (s.started_at at time zone p_tz) >= v_last_week_start
         and (s.started_at at time zone p_tz) < v_this_week_start then 'last_week'
        else null
      end as week_bucket
    from study_sessions s
    where s.user_id = v_uid
      and (s.started_at at time zone p_tz) >= v_last_week_start
      and (s.started_at at time zone p_tz) < v_next_week_start
  ),
  -- Day-by-day totals for this week (days 1 to 7: Monday to Sunday)
  this_week_days as (
    select
      d.day_num,
      coalesce(sum(s.duration_seconds), 0)::bigint as secs
    from generate_series(1, 7) d(day_num)
    left join two_week_sessions s
      on s.day_of_week = d.day_num and s.week_bucket = 'this_week'
    group by d.day_num
    order by d.day_num
  ),
  -- Day-by-day totals for last week (days 1 to 7: Monday to Sunday)
  last_week_days as (
    select
      d.day_num,
      coalesce(sum(s.duration_seconds), 0)::bigint as secs
    from generate_series(1, 7) d(day_num)
    left join two_week_sessions s
      on s.day_of_week = d.day_num and s.week_bucket = 'last_week'
    group by d.day_num
    order by d.day_num
  ),
  -- Summary metrics
  summary as (
    select
      coalesce(sum(case when week_bucket = 'this_week' then duration_seconds else 0 end), 0)::bigint as this_week_seconds,
      coalesce(sum(case when week_bucket = 'last_week' then duration_seconds else 0 end), 0)::bigint as last_week_seconds,
      coalesce(max(case when week_bucket = 'this_week' then duration_seconds else null end), 0)::bigint as longest_session_seconds
    from two_week_sessions
  ),
  -- Top subject this week and its change vs last week
  subject_this_week as (
    select
      s.subject_id,
      coalesce(sub.name, 'General Study') as subject_name,
      coalesce(sum(s.duration_seconds), 0)::bigint as this_week_secs
    from two_week_sessions s
    left join subjects sub on sub.id = s.subject_id
    where s.week_bucket = 'this_week'
    group by s.subject_id, sub.name
    order by this_week_secs desc
    limit 1
  ),
  subject_last_week as (
    select
      coalesce(sum(s.duration_seconds), 0)::bigint as last_week_secs
    from two_week_sessions s
    where s.week_bucket = 'last_week'
      and (
        (s.subject_id is null and (select subject_id from subject_this_week) is null)
        or s.subject_id = (select subject_id from subject_this_week)
      )
  ),
  -- Best day of this week
  best_day_calc as (
    select
      day_num,
      secs,
      case day_num
        when 1 then 'Monday'
        when 2 then 'Tuesday'
        when 3 then 'Wednesday'
        when 4 then 'Thursday'
        when 5 then 'Friday'
        when 6 then 'Saturday'
        when 7 then 'Sunday'
      end as day_name
    from this_week_days
    where secs > 0
    order by secs desc, day_num asc
    limit 1
  )
  select jsonb_build_object(
    'this_week_seconds', (select this_week_seconds from summary),
    'last_week_seconds', (select last_week_seconds from summary),
    'this_week_by_day', (select jsonb_agg(secs order by day_num) from this_week_days),
    'last_week_by_day', (select jsonb_agg(secs order by day_num) from last_week_days),
    'this_week_active_days', (select count(*) from this_week_days where secs > 0),
    'last_week_active_days', (select count(*) from last_week_days where secs > 0),
    'longest_session_seconds', (select longest_session_seconds from summary),
    'top_subject', (
      case
        when (select count(*) from subject_this_week) > 0 then
          jsonb_build_object(
            'subject_id', (select subject_id from subject_this_week),
            'name', (select subject_name from subject_this_week),
            'this_week_seconds', (select this_week_secs from subject_this_week),
            'last_week_seconds', coalesce((select last_week_secs from subject_last_week), 0),
            'change_seconds', (select this_week_secs from subject_this_week) - coalesce((select last_week_secs from subject_last_week), 0)
          )
        else null
      end
    ),
    'best_day', (
      case
        when (select count(*) from best_day_calc) > 0 then
          jsonb_build_object(
            'day_index', (select day_num from best_day_calc),
            'day_name', (select day_name from best_day_calc),
            'seconds', (select secs from best_day_calc)
          )
        else null
      end
    )
  ) into v_result;

  return v_result;
end $$;

revoke all on function public.get_my_weekly_report(text) from public;
grant execute on function public.get_my_weekly_report(text) to authenticated;

-- ====================================================================
-- 6. Focus Goals Table & RPC (Phase I)
-- ====================================================================

-- 6.1 Table focus_goals
create table if not exists public.focus_goals (
  user_id uuid primary key references auth.users(id) on delete cascade,
  daily_minutes int not null check (daily_minutes between 5 and 720),
  weekly_minutes int not null check (weekly_minutes between 30 and 5040),
  updated_at timestamptz not null default now()
);

-- 6.2 RLS on focus_goals
alter table public.focus_goals enable row level security;

drop policy if exists "read own goal" on public.focus_goals;
create policy "read own goal" on public.focus_goals
  for select using (auth.uid() = user_id);

drop policy if exists "insert own goal if premium" on public.focus_goals;
create policy "insert own goal if premium" on public.focus_goals
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.subscriptions
      where user_id = auth.uid()
        and premium_until > now()
    )
  );

drop policy if exists "update own goal if premium" on public.focus_goals;
create policy "update own goal if premium" on public.focus_goals
  for update using (
    auth.uid() = user_id
    and exists (
      select 1 from public.subscriptions
      where user_id = auth.uid()
        and premium_until > now()
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.subscriptions
      where user_id = auth.uid()
        and premium_until > now()
    )
  );

-- 6.3 Goal Progress & Consecutive Daily Streak RPC
create or replace function public.get_my_goal_progress(p_tz text default 'UTC')
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_premium boolean;
  v_uid uuid;
  v_now timestamp;
  v_today date;
  v_this_week_start timestamp;
  v_next_week_start timestamp;
  v_daily_minutes int;
  v_weekly_minutes int;
  v_today_seconds bigint := 0;
  v_this_week_seconds bigint := 0;
  v_streak int := 0;
  v_check_date date;
  v_day_seconds bigint;
  v_daily_goal_secs bigint;
  v_result jsonb;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  -- 1. Enforce premium status on the server
  select coalesce(s.premium_until > now(), false) into v_premium
  from subscriptions s where s.user_id = v_uid;
  if not coalesce(v_premium, false) then
    raise exception 'premium_required' using errcode = '42501';
  end if;

  -- 2. Timezone resolution
  begin
    v_now := (now() at time zone p_tz);
  exception when others then
    v_now := (now() at time zone 'UTC');
    p_tz := 'UTC';
  end;

  v_today := v_now::date;
  v_this_week_start := date_trunc('week', v_now);
  v_next_week_start := v_this_week_start + interval '7 days';

  -- 3. Read Goal values for current user
  select daily_minutes, weekly_minutes
  into v_daily_minutes, v_weekly_minutes
  from public.focus_goals
  where user_id = v_uid;

  -- 4. Calculate today seconds
  select coalesce(sum(duration_seconds), 0)::bigint
  into v_today_seconds
  from public.study_sessions
  where user_id = v_uid
    and (started_at at time zone p_tz)::date = v_today;

  -- 5. Calculate this-week seconds
  select coalesce(sum(duration_seconds), 0)::bigint
  into v_this_week_seconds
  from public.study_sessions
  where user_id = v_uid
    and (started_at at time zone p_tz) >= v_this_week_start
    and (started_at at time zone p_tz) < v_next_week_start;

  -- 6. Calculate consecutive daily goal streak
  if v_daily_minutes is not null and v_daily_minutes > 0 then
    v_daily_goal_secs := v_daily_minutes * 60;

    -- If today already reached the goal, start streak count at 1 and check backwards from yesterday
    if v_today_seconds >= v_daily_goal_secs then
      v_streak := 1;
      v_check_date := v_today - 1;
    else
      -- Today is not yet reached, so today does NOT break the streak; count begins from yesterday
      v_streak := 0;
      v_check_date := v_today - 1;
    end if;

    -- Step backwards day by day to count consecutive days reaching daily goal
    loop
      select coalesce(sum(duration_seconds), 0)::bigint
      into v_day_seconds
      from public.study_sessions
      where user_id = v_uid
        and (started_at at time zone p_tz)::date = v_check_date;

      if v_day_seconds >= v_daily_goal_secs then
        v_streak := v_streak + 1;
        v_check_date := v_check_date - 1;
      else
        exit; -- Streak broke on gap day or sub-goal day
      end if;

      -- Safety upper limit
      if v_streak >= 365 then
        exit;
      end if;
    end loop;
  else
    v_streak := 0;
  end if;

  select jsonb_build_object(
    'daily_minutes', v_daily_minutes,
    'weekly_minutes', v_weekly_minutes,
    'today_seconds', v_today_seconds,
    'this_week_seconds', v_this_week_seconds,
    'goal_streak', v_streak
  ) into v_result;

  return v_result;
end $$;

revoke all on function public.get_my_goal_progress(text) from public;
grant execute on function public.get_my_goal_progress(text) to authenticated;

-- ====================================================================
-- 7. Profile Flair Table & get_flair RPC (Phase J)
-- ====================================================================

-- 7.1 Table profile_flair
create table if not exists public.profile_flair (
  user_id uuid primary key references auth.users(id) on delete cascade,
  frame text not null default 'gold' check (frame in ('gold', 'aurora', 'ember')),
  show_badge boolean not null default true,
  updated_at timestamptz not null default now()
);

-- 7.2 RLS on profile_flair
alter table public.profile_flair enable row level security;

drop policy if exists "owner reads" on public.profile_flair;
create policy "owner reads" on public.profile_flair
  for select using (auth.uid() = user_id);

drop policy if exists "insert own flair if premium" on public.profile_flair;
create policy "insert own flair if premium" on public.profile_flair
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.subscriptions
      where user_id = auth.uid()
        and premium_until > now()
    )
  );

drop policy if exists "update own flair if premium" on public.profile_flair;
create policy "update own flair if premium" on public.profile_flair
  for update using (
    auth.uid() = user_id
    and exists (
      select 1 from public.subscriptions
      where user_id = auth.uid()
        and premium_until > now()
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.subscriptions
      where user_id = auth.uid()
        and premium_until > now()
    )
  );

-- 7.3 Public Flair Lookup RPC
create or replace function public.get_flair(p_user_ids uuid[])
returns table (user_id uuid, frame text)
language sql stable security definer set search_path = public as $$
  select
    s.user_id,
    coalesce(pf.frame, 'gold') as frame
  from unnest(coalesce(p_user_ids[1:100], array[]::uuid[])) as input_id
  join public.subscriptions s on s.user_id = input_id
  left join public.profile_flair pf on pf.user_id = s.user_id
  where coalesce(pf.show_badge, true) = true
    and s.premium_until > now();
$$;

revoke all on function public.get_flair(uuid[]) from public;
grant execute on function public.get_flair(uuid[]) to authenticated, anon;



