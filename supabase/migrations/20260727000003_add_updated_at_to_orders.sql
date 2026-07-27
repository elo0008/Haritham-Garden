-- Migration: Add updated_at column to orders table and auto-update trigger
-- Run this script in your Supabase SQL Editor:

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Trigger function to auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION update_orders_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_updated_at_column();
