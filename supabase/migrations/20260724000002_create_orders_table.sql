-- ============================================================
-- Migration: Create orders table with auto-incrementing order_ref
-- ============================================================

-- Sequence that drives HG-001, HG-002, ...
CREATE SEQUENCE order_number_seq START 1;

-- Function that fires before INSERT to set order_ref
CREATE OR REPLACE FUNCTION generate_order_ref()
RETURNS TRIGGER AS $$
BEGIN
  -- Only auto-generate if the caller didn't supply one
  IF NEW.order_ref IS NULL OR NEW.order_ref = '' THEN
    NEW.order_ref := 'HG-' || LPAD(nextval('order_number_seq')::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── orders ───────────────────────────────────────────────────
CREATE TABLE orders (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_ref      text        NOT NULL UNIQUE,
  -- items snapshot: [{plant_id, name, price, qty}, ...]
  items          jsonb       NOT NULL DEFAULT '[]',
  subtotal       numeric     NOT NULL CHECK (subtotal >= 0),
  delivery_price numeric,
  final_total    numeric,
  handled        boolean     NOT NULL DEFAULT false,
  handled_at     timestamptz,
  deleted        boolean     NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Attach the order_ref trigger
CREATE TRIGGER trg_orders_set_order_ref
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_order_ref();

-- Indexes for common admin queries
CREATE INDEX idx_orders_handled    ON orders (handled);
CREATE INDEX idx_orders_deleted    ON orders (deleted);
CREATE INDEX idx_orders_created_at ON orders (created_at DESC);
