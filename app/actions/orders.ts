"use server";

import { createClient } from "@/lib/supabase/server";
import type { CartItem } from "@/lib/types";

export interface CreateOrderResult {
  success: boolean;
  orderId?: string;
  orderRef?: string;
  error?: string;
}

export interface CustomerDetailsInput {
  name?: string | null;
  phone?: string | null;
  address?: string | null;
  pincode?: string | null;
}

export async function createCustomerOrder(
  items: CartItem[],
  subtotal: number,
  customerDetails?: CustomerDetailsInput
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

    const cleanName = customerDetails?.name?.trim() || null;
    const cleanPhone = customerDetails?.phone?.trim() || null;
    const cleanAddress = customerDetails?.address?.trim() || null;
    const cleanPincode = customerDetails?.pincode?.trim() || null;

    // 1. Try calling the place_order RPC function if available
    const { data: rpcData, error: rpcError } = await supabase.rpc("place_order", {
      p_items: itemSnapshots,
      p_subtotal: subtotal,
      p_customer_name: cleanName,
      p_customer_phone: cleanPhone,
      p_customer_address: cleanAddress,
      p_customer_pincode: cleanPincode,
    });

    if (!rpcError && rpcData) {
      // If RPC returned an object or string
      const refStr = typeof rpcData === "string" ? rpcData : rpcData.order_ref || String(rpcData);
      const uuidStr = typeof rpcData === "object" && rpcData?.id ? rpcData.id : undefined;
      return {
        success: true,
        orderId: uuidStr,
        orderRef: refStr,
      };
    }

    // 2. Direct insert (or fallback if RPC signature doesn't match)
    const { data: insertData, error: insertError } = await supabase
      .from("orders")
      .insert({
        items: itemSnapshots,
        subtotal,
        status: "pending",
        handled: false,
        deleted: false,
        customer_name: cleanName,
        customer_phone: cleanPhone,
        customer_address: cleanAddress,
        customer_pincode: cleanPincode,
      })
      .select("id, order_ref")
      .single();

    if (insertError) {
      console.error("Error creating customer order:", insertError.message);
      return {
        success: false,
        error:
          "Database permission error placing order. Please run migration 20260726000013_orders_customer_details.sql in Supabase SQL Editor.",
      };
    }

    return {
      success: true,
      orderId: insertData.id,
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
