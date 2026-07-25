"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Marks an order as handled and sets delivery_price and final_total.
 */
export async function markOrderHandled(
  orderId: string,
  deliveryPrice: number
): Promise<void> {
  const supabase = await createClient();

  // 1. Fetch current subtotal
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("subtotal")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) {
    throw new Error(fetchError?.message || "Order not found");
  }

  const subtotal = Number(order.subtotal) || 0;
  const finalTotal = subtotal + Math.max(0, deliveryPrice);

  // 2. Update order record
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      delivery_price: deliveryPrice,
      final_total: finalTotal,
      handled: true,
      handled_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath("/admin/orders");
}

/**
 * Re-opens / marks an order as unhandled.
 */
export async function markOrderUnhandled(orderId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("orders")
    .update({
      handled: false,
      handled_at: null,
    })
    .eq("id", orderId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/orders");
}

/**
 * Soft deletes an order by setting deleted = true.
 */
export async function softDeleteOrder(orderId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("orders")
    .update({
      deleted: true,
    })
    .eq("id", orderId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/orders");
}

/**
 * Updates admin-only notes for an order.
 */
export async function updateOrderNotes(
  orderId: string,
  notes: string | null
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("orders")
    .update({
      notes: notes?.trim() || null,
    })
    .eq("id", orderId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/orders");
}
