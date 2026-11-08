-- ====================================================================
-- study.io - Room Description Database Migration
-- ====================================================================

-- Add description column to study_rooms table
alter table public.study_rooms add column if not exists description text;
