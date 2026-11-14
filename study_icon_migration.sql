-- Migration: Add study_icon column to profiles and create set_my_study_icon RPC
-- Run this in your Supabase Dashboard -> SQL Editor

-- 1. Add the study_icon column to public.profiles (additive only, never drops)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS study_icon text DEFAULT 'lamp';

-- 2. Create the security-definer RPC
-- Valid free icons: lamp, book, pencil, coffee
-- Valid premium icons: owl, cat, rocket, sprout, laptop, night
CREATE OR REPLACE FUNCTION public.set_my_study_icon(p_icon text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id     uuid := auth.uid();
  v_free_icons  text[] := ARRAY['lamp', 'book', 'pencil', 'coffee'];
  v_prem_icons  text[] := ARRAY['owl', 'cat', 'rocket', 'sprout', 'laptop', 'night'];
  v_all_icons   text[];
  v_is_premium  boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_all_icons := v_free_icons || v_prem_icons;

  -- Validate icon identifier
  IF NOT (p_icon = ANY(v_all_icons)) THEN
    RAISE EXCEPTION 'Invalid study icon id: %', p_icon;
  END IF;

  -- Premium check for premium icons
  IF p_icon = ANY(v_prem_icons) THEN
    SELECT COALESCE(s.premium_until > now(), false) INTO v_is_premium
    FROM (SELECT 1) d
    LEFT JOIN public.subscriptions s ON s.user_id = v_user_id;

    IF NOT COALESCE(v_is_premium, false) THEN
      RAISE EXCEPTION 'Premium subscription required for icon: %', p_icon;
    END IF;
  END IF;

  -- Update only caller's own profile row
  UPDATE public.profiles
  SET study_icon = p_icon
  WHERE id = v_user_id;
END;
$$;

-- Secure permissions: revoke from public, grant to authenticated
REVOKE ALL ON FUNCTION public.set_my_study_icon(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_my_study_icon(text) TO authenticated;
