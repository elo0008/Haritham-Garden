-- ============================================================
-- Migration: SECURITY DEFINER function for customer order placement
-- ============================================================

-- Function that allows public (anonymous) site visitors to place an order
-- and receive the auto-generated order_ref (e.g. HG-001) without requiring
-- SELECT access on the orders table.
CREATE OR REPLACE FUNCTION place_order(p_items jsonb, p_subtotal numeric)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_ref text;
BEGIN
  INSERT INTO orders (items, subtotal, handled, deleted)
  VALUES (p_items, p_subtotal, false, false)
  RETURNING order_ref INTO v_order_ref;

  RETURN v_order_ref;
END;
$$;

-- Grant execution permission to public roles (anon + authenticated)
GRANT EXECUTE ON FUNCTION place_order(jsonb, numeric) TO anon, authenticated, service_role;
