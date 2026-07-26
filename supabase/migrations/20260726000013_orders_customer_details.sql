-- ============================================================
-- Migration 13: Add optional customer delivery details to orders
-- ============================================================

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_name    text,
  ADD COLUMN IF NOT EXISTS customer_phone   text,
  ADD COLUMN IF NOT EXISTS customer_address text,
  ADD COLUMN IF NOT EXISTS customer_pincode text;
