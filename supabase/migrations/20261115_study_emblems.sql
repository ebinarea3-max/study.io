-- Migration: Study Emblems (7-stage living growth scenes)
-- Replaces study icons with growth emblem families:
--   Free:    spark
--   Premium: bloom, crystal, stars, summit, skyline
--
-- Note: Reuses the existing public.profiles.study_icon column so no table alterations are required.

-- 1. Create or replace the security-definer RPC
CREATE OR REPLACE FUNCTION public.set_my_study_icon(p_icon text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id     uuid := auth.uid();
  v_free_fam    text[] := ARRAY['spark'];
  v_prem_fam    text[] := ARRAY['bloom', 'crystal', 'stars', 'summit', 'skyline'];
  v_all_fam     text[];
  v_is_premium  boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_all_fam := v_free_fam || v_prem_fam;

  -- Validate emblem family identifier
  IF NOT (p_icon = ANY(v_all_fam)) THEN
    RAISE EXCEPTION 'Invalid study emblem family: %', p_icon;
  END IF;

  -- Premium check for premium emblem families
  IF p_icon = ANY(v_prem_fam) THEN
    SELECT COALESCE(s.premium_until > now(), false) INTO v_is_premium
    FROM (SELECT 1) d
    LEFT JOIN public.subscriptions s ON s.user_id = v_user_id;

    IF NOT COALESCE(v_is_premium, false) THEN
      RAISE EXCEPTION 'Premium subscription required for emblem: %', p_icon;
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

-- OPTIONAL CLEANUP:
-- If you want to reset legacy study icon choices ('lamp', 'book', 'pencil', 'coffee', 'owl', etc.)
-- back to NULL (which defaults automatically to 'spark'):
--
-- UPDATE public.profiles
-- SET study_icon = NULL
-- WHERE study_icon NOT IN ('spark', 'bloom', 'crystal', 'stars', 'summit', 'skyline');
