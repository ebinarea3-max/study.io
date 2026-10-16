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
