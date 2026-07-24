"use server";

import { createClient } from "@/lib/supabase/server";
import type { CartItem } from "@/lib/types";

export interface CreateOrderResult {
  success: boolean;
  orderRef?: string;
  error?: string;
}

export async function createCustomerOrder(
  items: CartItem[],
  subtotal: number
): Promise<CreateOrderResult> {
  try {
    if (!items || items.length === 0) {
      return { success: false, error: "Cart is empty." };
    }

    const supabase = await createClient();

    // Prepare item snapshots for DB record
    const itemSnapshots = items.map((item) => ({
      plant_id: item.plant_id,
      name: item.name,
      price: item.price,
      qty: item.qty,
    }));

    // 1. Try calling the place_order RPC function (bypasses RLS SELECT restriction)
    const { data: rpcData, error: rpcError } = await supabase.rpc("place_order", {
      p_items: itemSnapshots,
      p_subtotal: subtotal,
    });

    if (!rpcError && rpcData) {
      return {
        success: true,
        orderRef: rpcData as string,
      };
    }

    // 2. Fallback to direct insert if RPC is not yet created in DB
    const { data: insertData, error: insertError } = await supabase
      .from("orders")
      .insert({
        items: itemSnapshots,
        subtotal,
        handled: false,
        deleted: false,
      })
      .select("order_ref")
      .single();

    if (insertError) {
      console.error("Error creating customer order:", insertError.message);
      return {
        success: false,
        error:
          "Database permission error placing order. Please run migration 20260724000005_place_order_function.sql in Supabase SQL Editor.",
      };
    }

    return {
      success: true,
      orderRef: insertData.order_ref,
    };
  } catch (err) {
    console.error("Unexpected error creating customer order:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to place order.",
    };
  }
}
