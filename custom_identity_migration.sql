-- ====================================================================
-- Study.io Premium Feature: Custom Study Room Badges & Custom Titles
-- Migration: Add custom_title and custom_badge to profiles with RLS enforcement
-- ====================================================================

-- 1. Add optional columns to profiles table with character length constraints
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS custom_title text CHECK (char_length(custom_title) <= 20),
  ADD COLUMN IF NOT EXISTS custom_badge text CHECK (char_length(custom_badge) <= 15);

-- 2. Database trigger to guarantee that only active premium subscribers can update custom_title or custom_badge
CREATE OR REPLACE FUNCTION public.check_premium_identity_update()
RETURNS trigger AS $$
DECLARE
  v_is_premium boolean;
BEGIN
  -- Only validate if custom_title or custom_badge is being changed to a non-null value
  IF (NEW.custom_title IS DISTINCT FROM OLD.custom_title AND NEW.custom_title IS NOT NULL) OR 
     (NEW.custom_badge IS DISTINCT FROM OLD.custom_badge AND NEW.custom_badge IS NOT NULL) THEN
    
    -- Verify active premium subscription
    SELECT coalesce(s.premium_until > now(), false) INTO v_is_premium
    FROM public.subscriptions s
    WHERE s.user_id = NEW.id;

    IF NOT coalesce(v_is_premium, false) THEN
      RAISE EXCEPTION 'Active Study.io Premium subscription required to set custom titles and study room badges.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_check_premium_identity ON public.profiles;
CREATE TRIGGER trg_check_premium_identity
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.check_premium_identity_update();

-- 3. Dedicated Security Definer RPC for updating custom identity safely
CREATE OR REPLACE FUNCTION public.update_custom_study_room_identity(
  p_custom_title text,
  p_custom_badge text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_is_premium boolean;
  v_clean_title text := nullif(trim(p_custom_title), '');
  v_clean_badge text := nullif(trim(p_custom_badge), '');
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthenticated');
  END IF;

  IF v_clean_title IS NOT NULL AND char_length(v_clean_title) > 20 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Custom title cannot exceed 20 characters');
  END IF;

  IF v_clean_badge IS NOT NULL AND char_length(v_clean_badge) > 15 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Badge tag cannot exceed 15 characters');
  END IF;

  -- Verify premium status
  SELECT coalesce(s.premium_until > now(), false) INTO v_is_premium
  FROM public.subscriptions s
  WHERE s.user_id = v_user_id;

  IF (v_clean_title IS NOT NULL OR v_clean_badge IS NOT NULL) AND NOT coalesce(v_is_premium, false) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Active Study.io Premium subscription required');
  END IF;

  UPDATE public.profiles
  SET custom_title = v_clean_title,
      custom_badge = v_clean_badge
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'custom_title', v_clean_title,
    'custom_badge', v_clean_badge
  );
END;
$$;

REVOKE ALL ON FUNCTION public.update_custom_study_room_identity(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.update_custom_study_room_identity(text, text) TO authenticated;
