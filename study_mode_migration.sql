-- ====================================================================
-- study.io: Study Mode (Focus Mode vs Subject Mode) Migration
-- ====================================================================
-- Description:
-- 1. Adds study_mode column ('focus' | 'subject' | NULL) to public.profiles.
--    NULL indicates "not chosen yet" (triggers first-time onboarding for new accounts).
-- 2. Backfills existing profiles to 'subject' so existing users experience zero disruption.
-- 3. Provides set_my_study_mode(p_mode text) security-definer RPC for safe client updates.
-- 4. Provides get_or_create_default_subject() security-definer RPC to resolve or create
--    the "General Focus" default subject (#5A6B6A) idempotently for Focus mode sessions.
-- ====================================================================

-- 1. Add study_mode column to profiles
alter table public.profiles 
  add column if not exists study_mode text 
  check (study_mode in ('focus', 'subject'));

comment on column public.profiles.study_mode is 
  'User preferred study mode: focus (timer only, no subjects) or subject (track individual subjects). NULL means not chosen yet.';

-- 2. Backfill existing profiles to 'subject'
-- Accounts that exist right now keep Subject mode and skip onboarding.
-- Accounts created afterwards start with NULL study_mode and see onboarding at first sign-in.
update public.profiles 
set study_mode = 'subject' 
where study_mode is null;

-- 3. RPC: set_my_study_mode(p_mode text)
-- Allows authenticated users to safely update only their own study_mode.
create or replace function public.set_my_study_mode(p_mode text)
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

  if p_mode not in ('focus', 'subject') then
    raise exception 'Invalid study mode. Must be either ''focus'' or ''subject''.';
  end if;

  update public.profiles
  set study_mode = p_mode
  where id = v_user_id;
end;
$$;

-- Secure RPC permissions
revoke all on function public.set_my_study_mode(text) from public;
grant execute on function public.set_my_study_mode(text) to authenticated;

-- 4. RPC: get_or_create_default_subject()
-- Returns the id of the authenticated user's default subject ("General Focus"),
-- creating it if it does not already exist. Idempotent and concurrency-safe.
create or replace function public.get_or_create_default_subject()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_subject_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- 1. Check if 'General Focus' subject already exists for this user (case-insensitive)
  select id into v_subject_id
  from public.subjects
  where user_id = v_user_id
    and lower(trim(name)) = 'general focus'
  limit 1;

  if v_subject_id is not null then
    return v_subject_id;
  end if;

  -- 2. Create 'General Focus' subject with neutral muted teal-gray (#5A6B6A)
  -- Protected by block exception to handle concurrent execution safely
  begin
    insert into public.subjects (
      user_id,
      name,
      color,
      is_archived
    ) values (
      v_user_id,
      'General Focus',
      '#5A6B6A',
      false
    )
    returning id into v_subject_id;
  exception
    when unique_violation then
      -- If inserted concurrently, fetch the winner row
      select id into v_subject_id
      from public.subjects
      where user_id = v_user_id
        and lower(trim(name)) = 'general focus'
      limit 1;
  end;

  return v_subject_id;
end;
$$;

-- Secure RPC permissions
revoke all on function public.get_or_create_default_subject() from public;
grant execute on function public.get_or_create_default_subject() to authenticated;
