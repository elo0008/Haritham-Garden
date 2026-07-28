"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Order } from "@/lib/types";
import type { ManualOrderItemInput } from "../admin/orders/actions";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Fetches only orders matching the exact UUIDs stored in the customer's browser.
 * Never searches by order_ref or unverified query params.
 */
export async function fetchCustomerOrdersByUuids(uuids: string[]): Promise<Order[]> {
  if (!uuids || !Array.isArray(uuids) || uuids.length === 0) {
    return [];
  }

  // Sanitize and filter valid UUID format strings only
  const validUuids = Array.from(
    new Set(uuids.filter((id) => typeof id === "string" && UUID_REGEX.test(id.trim())))
  );

  if (validUuids.length === 0) {
    return [];
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .in("id", validUuids)
      .or("hidden_by_customer.is.null,hidden_by_customer.eq.false")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching customer orders by UUIDs:", error.message);
      return [];
    }

    return (data as Order[]) ?? [];
  } catch (err) {
    console.error("Unexpected error fetching customer orders:", err);
    return [];
  }
}

/**
 * Hides an order from the customer's "My Orders" view by setting hidden_by_customer = true.
 * Does NOT delete the database row or alter the order for the admin.
 */
export async function hideOrderForCustomer(
  orderId: string,
  allowedUuids: string[]
): Promise<void> {
  if (!orderId || !UUID_REGEX.test(orderId)) {
    throw new Error("Invalid order ID.");
  }

  const sanitizedAllowed = (allowedUuids || []).filter(
    (id) => typeof id === "string" && UUID_REGEX.test(id)
  );
  if (!sanitizedAllowed.includes(orderId)) {
    throw new Error("Unauthorized access: this order was not placed on this device.");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("orders")
    .update({
      hidden_by_customer: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/my-orders");
}

/**
 * Verifies that the order's current updated_at timestamp matches the expected timestamp captured when editing began.
 * If expectedUpdatedAt is provided and does not match, throws a conflict error.
 */
function verifyOrderNotModified(
  dbUpdatedAt?: string | null,
  expectedUpdatedAt?: string | null
) {
  if (expectedUpdatedAt && dbUpdatedAt) {
    const dbTime = new Date(dbUpdatedAt).getTime();
    const expTime = new Date(expectedUpdatedAt).getTime();
    if (Math.abs(dbTime - expTime) > 1000) {
      throw new Error(
        "This order was updated elsewhere since you started editing. Please refresh and try again."
      );
    }
  }
}

/**
 * Customer-facing action to edit an order's items.
 * Strictly verifies that orderId belongs to the customer's device UUID list.
 * Only allows editing while order status is 'pending' or 'handled'.
 */
export async function updateCustomerOrderItemsByCustomer(
  orderId: string,
  allowedUuids: string[],
  newItems: ManualOrderItemInput[],
  expectedUpdatedAt?: string | null
): Promise<void> {
  if (!orderId || !UUID_REGEX.test(orderId)) {
    throw new Error("Invalid order ID.");
  }

  // Security check: orderId MUST be present in device's localStorage UUID array
  const sanitizedAllowed = (allowedUuids || []).filter((id) => typeof id === "string" && UUID_REGEX.test(id));
  if (!sanitizedAllowed.includes(orderId)) {
    throw new Error("Unauthorized access: this order was not placed on this device.");
  }

  if (!newItems || newItems.length === 0) {
    throw new Error("Your order must contain at least one plant item.");
  }

  const supabase = await createClient();

  // 1. Fetch current order
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("status, subtotal, estimated_courier_price, final_courier_price, delivery_price, discount_type, discount_value, discount_amount_applied, updated_at")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) {
    throw new Error(fetchError?.message || "Order not found.");
  }

  verifyOrderNotModified(order.updated_at, expectedUpdatedAt);

  // 2. Editable window check: only pending or handled allowed
  if (order.status !== "pending" && order.status !== "handled") {
    throw new Error("This order is being processed and can no longer be changed on this device.");
  }

  // 3. Recalculate subtotal
  const subtotal = newItems.reduce((acc, item) => acc + item.price * item.qty, 0);

  // 4. Recalculate discount if present
  let discountAmountApplied: number | null = order.discount_amount_applied ? Number(order.discount_amount_applied) : null;
  if (order.discount_type && order.discount_value != null) {
    const val = Number(order.discount_value);
    if (order.discount_type === "flat") {
      discountAmountApplied = Math.min(val, subtotal);
    } else if (order.discount_type === "percentage") {
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
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath("/my-orders");
  revalidatePath("/admin/orders");
}

/**
 * Soft-deletes an order initiated by customer cancellation.
 * Sets deleted = true and cancelled_by_customer = true.
 * Allowed only while order status is 'pending' or 'handled'.
 */
export async function cancelCustomerOrder(
  orderId: string,
  allowedUuids: string[],
  expectedUpdatedAt?: string | null
): Promise<void> {
  if (!orderId || !UUID_REGEX.test(orderId)) {
    throw new Error("Invalid order ID.");
  }

  const sanitizedAllowed = (allowedUuids || []).filter((id) => typeof id === "string" && UUID_REGEX.test(id));
  if (!sanitizedAllowed.includes(orderId)) {
    throw new Error("Unauthorized access: this order was not placed on this device.");
  }

  const supabase = await createClient();

  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("status, deleted, updated_at")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) {
    throw new Error(fetchError?.message || "Order not found.");
  }

  verifyOrderNotModified(order.updated_at, expectedUpdatedAt);

  if (order.status !== "pending" && order.status !== "handled") {
    throw new Error("This order is already being processed and can no longer be cancelled directly.");
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      deleted: true,
      cancelled_by_customer: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath("/my-orders");
  revalidatePath("/admin/orders");
}

