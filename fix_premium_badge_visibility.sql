-- ====================================================================
-- study.io: Fix Verified Premium Scholar Badge Visibility for All Users
-- Run this in your Supabase Dashboard > SQL Editor > New query
-- ====================================================================

-- 1. Ensure public read policy on subscriptions for active/valid premium users
-- This allows other users (and guests) to see who has an active verified premium subscription on Leaderboards & Rooms.
drop policy if exists "allow public read active subscriptions" on public.subscriptions;
create policy "allow public read active subscriptions" on public.subscriptions
  for select using (
    status in ('active', 'trialing') 
    or (premium_until is not null and premium_until > now())
  );

-- 2. Create the get_flair RPC function with security definer (bypasses RLS safely)
create or replace function public.get_flair(p_user_ids uuid[])
returns table (user_id uuid, frame text)
language plpgsql security definer set search_path = public as $$
begin
  return query
  select
    s.user_id,
    'gold'::text as frame
  from unnest(p_user_ids) as uid
  join public.subscriptions s on s.user_id = uid
  where (s.status in ('active', 'trialing') or (s.premium_until is not null and s.premium_until > now()));
end;
$$;

-- 3. Also support text[] parameter for robustness against client type casts
create or replace function public.get_flair(p_user_ids text[])
returns table (user_id uuid, frame text)
language plpgsql security definer set search_path = public as $$
begin
  return query
  select
    s.user_id,
    'gold'::text as frame
  from unnest(p_user_ids) as uid_text
  join public.subscriptions s on s.user_id::text = uid_text
  where (s.status in ('active', 'trialing') or (s.premium_until is not null and s.premium_until > now()));
end;
$$;

-- 4. Grant execute permissions to both authenticated and anonymous users
revoke all on function public.get_flair(uuid[]) from public;
grant execute on function public.get_flair(uuid[]) to authenticated, anon;

revoke all on function public.get_flair(text[]) from public;
grant execute on function public.get_flair(text[]) to authenticated, anon;

-- 5. Ensure 'wren' (and any premium scholar) has an active verified subscription
-- This activates / refreshes wren's active subscription in public.subscriptions
insert into public.subscriptions (user_id, status, plan, premium_until, updated_at)
select id, 'active', 'yearly', now() + interval '10 years', now()
from public.profiles
where username = 'wren' or lower(name) = 'wren'
on conflict (user_id) do update set
  status = 'active',
  premium_until = greatest(coalesce(public.subscriptions.premium_until, now()), now() + interval '10 years'),
  updated_at = now();

-- 6. Ensure profile_flair badge is enabled for wren
insert into public.profile_flair (user_id, frame, show_badge, updated_at)
select id, 'gold', true, now()
from public.profiles
where username = 'wren' or lower(name) = 'wren'
on conflict (user_id) do update set
  show_badge = true,
  updated_at = now();

-- 7. Verification: Run this query to verify both accounts show active verified premium
select
  p.id,
  p.username,
  p.name,
  s.status as subscription_status,
  s.premium_until,
  (s.status in ('active', 'trialing') or (s.premium_until is not null and s.premium_until > now())) as is_verified_premium
from public.profiles p
left join public.subscriptions s on s.user_id = p.id
where p.username in ('wren', 'trial') or lower(p.name) in ('wren', 'trial');
