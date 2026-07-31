-- Migration: Add address_changed_after_estimate to orders table
-- Description: Tracks if customer updated their delivery address after an estimated courier charge was set by admin.

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS address_changed_after_estimate BOOLEAN DEFAULT FALSE;
