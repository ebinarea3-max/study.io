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
