-- Migration: Add hidden_by_customer column to orders table
-- Allows customers to remove/hide orders from their device's "My Orders" history
-- without deleting database rows or affecting admin order views.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS hidden_by_customer boolean DEFAULT false;
