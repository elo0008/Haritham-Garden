-- ============================================================
-- Migration 12: Add secondary social fields to site_settings
-- ============================================================

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS secondary_social_label text,
  ADD COLUMN IF NOT EXISTS secondary_social_url   text;
