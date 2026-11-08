-- ====================================================================
-- study.io: First-Time Welcome Intro Walkthrough Migration
-- ====================================================================
-- Description:
-- 1. Adds intro_completed_at column to public.profiles.
--    NULL means "not completed yet" (triggers the intro walkthrough for new accounts).
-- 2. Backfills existing profiles to now() so existing accounts do not see the intro.
-- 3. Creates RPC complete_my_intro(): security definer, sets intro_completed_at for auth.uid().
-- ====================================================================

-- 1. Add intro_completed_at column to profiles
alter table public.profiles 
  add column if not exists intro_completed_at timestamptz;

comment on column public.profiles.intro_completed_at is 
  'Timestamp when the user finished or skipped the welcome intro walkthrough. NULL means not completed yet.';

-- 2. Backfill existing profiles to now()
-- Accounts that exist right now skip the automatic intro and can replay it anytime in Settings.
-- Accounts created afterwards start with NULL and see the intro after Study Mode onboarding.
update public.profiles 
set intro_completed_at = now() 
where intro_completed_at is null;

-- 3. RPC: complete_my_intro()
-- Marks the welcome intro as completed for the authenticated user.
create or replace function public.complete_my_intro()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  update public.profiles
  set intro_completed_at = coalesce(intro_completed_at, now())
  where id = v_user_id;
end;
$$;

-- Secure RPC permissions
revoke all on function public.complete_my_intro() from public;
grant execute on function public.complete_my_intro() to authenticated;
