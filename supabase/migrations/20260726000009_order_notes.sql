-- ============================================================
-- Migration 9: Add admin notes column to orders table
-- ============================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes text;
