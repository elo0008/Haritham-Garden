-- ============================================================
-- Migration 10: Add footer / shop trust fields to site_settings
-- ============================================================

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS location_text     text,
  ADD COLUMN IF NOT EXISTS service_area_text text,
  ADD COLUMN IF NOT EXISTS instagram_url    text,
  ADD COLUMN IF NOT EXISTS contact_phone    text;
