"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/lib/types";

/**
 * Updates an order's status along with optional estimated or final courier prices.
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  estimatedCourierPrice?: number | null,
  finalCourierPrice?: number | null
): Promise<void> {
  const supabase = await createClient();

  // 1. Fetch current order details
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("subtotal, estimated_courier_price, final_courier_price, delivery_price, handled")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) {
    throw new Error(fetchError?.message || "Order not found");
  }

  const subtotal = Number(order.subtotal) || 0;

  const effEstCourier =
    estimatedCourierPrice !== undefined
      ? estimatedCourierPrice
      : order.estimated_courier_price !== null
      ? Number(order.estimated_courier_price)
      : null;

  const effFinalCourier =
    finalCourierPrice !== undefined
      ? finalCourierPrice
      : order.final_courier_price !== null
      ? Number(order.final_courier_price)
      : null;

  // Use final courier fee if present, fallback to estimated, fallback to 0
  const courierFee = effFinalCourier ?? effEstCourier ?? 0;
  const finalTotal = subtotal + Math.max(0, courierFee);

  const isHandledOrBeyond = newStatus !== "pending";

  const updatePayload: Record<string, any> = {
    status: newStatus,
    estimated_courier_price: effEstCourier,
    final_courier_price: effFinalCourier,
    delivery_price: courierFee, // backward compatibility
    final_total: finalTotal,
    handled: newStatus === "dispatched" || isHandledOrBeyond,
  };

  if (isHandledOrBeyond && !order.handled) {
    updatePayload.handled_at = new Date().toISOString();
  } else if (newStatus === "pending") {
    updatePayload.handled = false;
    updatePayload.handled_at = null;
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update(updatePayload)
    .eq("id", orderId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath("/admin/orders");
}

/**
 * Backward compatibility: Marks an order as handled with delivery price.
 */
export async function markOrderHandled(
  orderId: string,
  deliveryPrice: number
): Promise<void> {
  return updateOrderStatus(orderId, "dispatched", null, deliveryPrice);
}

/**
 * Backward compatibility: Re-opens / marks an order as unhandled.
 */
export async function markOrderUnhandled(orderId: string): Promise<void> {
  return updateOrderStatus(orderId, "pending", null, null);
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
