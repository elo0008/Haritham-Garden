"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/lib/types";

export interface ManualOrderItemInput {
  plant_id: string;
  name: string;
  price: number;
  qty: number;
}

export interface ManualOrderInput {
  customerName?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  customerPincode?: string | null;
  items: ManualOrderItemInput[];
  status: OrderStatus;
  estimatedCourierPrice?: number | null;
  finalCourierPrice?: number | null;
  discountType?: 'flat' | 'percentage' | null;
  discountValue?: number | null;
}

/**
 * Manually creates an order from phone/in-person sales.
 */
export async function createManualOrder(
  input: ManualOrderInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const subtotal = input.items.reduce((acc, item) => acc + item.price * item.qty, 0);
    const itemSnapshots = input.items.map((item) => ({
      plant_id: item.plant_id,
      name: item.name,
      price: item.price,
      qty: item.qty,
    }));

    const estCourier = input.estimatedCourierPrice ?? null;
    const finalCourier = input.finalCourierPrice ?? null;
    const courierFee = finalCourier ?? estCourier ?? 0;

    // Compute optional discount
    let discountType: string | null = null;
    let discountValue: number | null = null;
    let discountAmountApplied: number | null = null;

    if (input.discountType && input.discountValue != null && input.discountValue > 0) {
      discountType = input.discountType;
      discountValue = input.discountValue;
      if (input.discountType === 'flat') {
        discountAmountApplied = Math.min(discountValue, subtotal);
      } else {
        discountAmountApplied = Math.round((subtotal * (discountValue / 100)) * 100) / 100;
      }
    }

    const finalTotal = subtotal - (discountAmountApplied ?? 0) + Math.max(0, courierFee);

    const isHandled = input.status !== "pending";

    const { error } = await supabase.from("orders").insert({
      items: itemSnapshots,
      subtotal: subtotal,
      status: input.status,
      estimated_courier_price: estCourier,
      final_courier_price: finalCourier,
      delivery_price: courierFee,
      final_total: finalTotal,
      discount_type: discountType,
      discount_value: discountValue,
      discount_amount_applied: discountAmountApplied,
      handled: isHandled,
      handled_at: isHandled ? new Date().toISOString() : null,
      deleted: false,
      customer_name: input.customerName?.trim() || null,
      customer_phone: input.customerPhone?.trim() || null,
      customer_address: input.customerAddress?.trim() || null,
      customer_pincode: input.customerPincode?.trim() || null,
    });

    if (error) {
      console.error("Error creating manual order:", error.message);
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    console.error("Unexpected error in createManualOrder:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create manual order.",
    };
  }
}

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
    .select("subtotal, estimated_courier_price, final_courier_price, delivery_price, handled, discount_amount_applied")
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
  const discountApplied = Number(order.discount_amount_applied) || 0;
  const finalTotal = subtotal - discountApplied + Math.max(0, courierFee);

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

/**
 * Updates customer contact and shipping details for an existing order.
 */
export async function updateOrderCustomerDetails(
  orderId: string,
  details: {
    customer_name?: string | null;
    customer_phone?: string | null;
    customer_address?: string | null;
    customer_pincode?: string | null;
  }
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("orders")
    .update({
      customer_name: details.customer_name?.trim() || null,
      customer_phone: details.customer_phone?.trim() || null,
      customer_address: details.customer_address?.trim() || null,
      customer_pincode: details.customer_pincode?.trim() || null,
    })
    .eq("id", orderId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}

/**
 * Helper: compute discount amount from type, value, and subtotal.
 */
function computeDiscountAmount(
  type: 'flat' | 'percentage',
  value: number,
  subtotal: number
): number {
  if (type === 'flat') {
    return Math.min(value, subtotal);
  }
  return Math.round((subtotal * (value / 100)) * 100) / 100;
}

/**
 * Applies an optional discount to an existing order.
 * Recalculates final_total with the discount factored in.
 */
export async function applyOrderDiscount(
  orderId: string,
  discountType: 'flat' | 'percentage',
  discountValue: number
): Promise<void> {
  const supabase = await createClient();

  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("subtotal, estimated_courier_price, final_courier_price, delivery_price")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) {
    throw new Error(fetchError?.message || "Order not found");
  }

  const subtotal = Number(order.subtotal) || 0;
  const discountAmountApplied = computeDiscountAmount(discountType, discountValue, subtotal);

  const courierFee =
    (order.final_courier_price != null ? Number(order.final_courier_price) : null) ??
    (order.estimated_courier_price != null ? Number(order.estimated_courier_price) : null) ??
    0;
  const finalTotal = subtotal - discountAmountApplied + Math.max(0, courierFee);

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      discount_type: discountType,
      discount_value: discountValue,
      discount_amount_applied: discountAmountApplied,
      final_total: finalTotal,
    })
    .eq("id", orderId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}

/**
 * Removes an applied discount from an order.
 * Recalculates final_total without the discount.
 */
export async function removeOrderDiscount(
  orderId: string
): Promise<void> {
  const supabase = await createClient();

  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("subtotal, estimated_courier_price, final_courier_price, delivery_price")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) {
    throw new Error(fetchError?.message || "Order not found");
  }

  const subtotal = Number(order.subtotal) || 0;
  const courierFee =
    (order.final_courier_price != null ? Number(order.final_courier_price) : null) ??
    (order.estimated_courier_price != null ? Number(order.estimated_courier_price) : null) ??
    0;
  const finalTotal = subtotal + Math.max(0, courierFee);

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      discount_type: null,
      discount_value: null,
      discount_amount_applied: null,
      final_total: finalTotal,
    })
    .eq("id", orderId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}

/**
 * Updates an order's items array, recalculates subtotal, discount, and final_total,
 * and sets items_edited_at timestamp.
 * Can only be performed while order status is 'pending' or 'handled'.
 */
export async function updateOrderItems(
  orderId: string,
  newItems: ManualOrderItemInput[]
): Promise<void> {
  const supabase = await createClient();

  // 1. Fetch current order
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("status, subtotal, estimated_courier_price, final_courier_price, delivery_price, discount_type, discount_value, discount_amount_applied")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) {
    throw new Error(fetchError?.message || "Order not found");
  }

  // 2. Lock rule: editable only when status is pending or handled
  if (order.status !== "pending" && order.status !== "handled") {
    throw new Error("Order items can only be edited while status is Pending or Handled.");
  }

  if (!newItems || newItems.length === 0) {
    throw new Error("An order must contain at least one plant item.");
  }

  // 3. Recalculate subtotal
  const subtotal = newItems.reduce((acc, item) => acc + item.price * item.qty, 0);

  // 4. Recalculate discount if present
  let discountAmountApplied: number | null = order.discount_amount_applied ? Number(order.discount_amount_applied) : null;
  if (order.discount_type && order.discount_value != null) {
    const val = Number(order.discount_value);
    if (order.discount_type === 'flat') {
      discountAmountApplied = Math.min(val, subtotal);
    } else if (order.discount_type === 'percentage') {
      discountAmountApplied = Math.round((subtotal * (val / 100)) * 100) / 100;
    }
  }

  // 5. Courier fee
  const courierFee =
    (order.final_courier_price != null ? Number(order.final_courier_price) : null) ??
    (order.estimated_courier_price != null ? Number(order.estimated_courier_price) : null) ??
    0;

  // 6. Recalculate final_total
  const finalTotal = subtotal - (discountAmountApplied ?? 0) + Math.max(0, courierFee);

  const itemSnapshots = newItems.map((item) => ({
    plant_id: item.plant_id,
    name: item.name,
    price: item.price,
    qty: item.qty,
  }));

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      items: itemSnapshots,
      subtotal,
      discount_amount_applied: discountAmountApplied,
      final_total: finalTotal,
      items_edited_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}



