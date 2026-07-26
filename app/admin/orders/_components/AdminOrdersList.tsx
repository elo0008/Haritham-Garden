"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Order, OrderStatus } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import { updateOrderStatus, softDeleteOrder, updateOrderNotes } from "../actions";

interface AdminOrdersListProps {
  orders: Order[];
}

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; bg: string; text: string; border: string; step: number }
> = {
  pending: { label: "1. Pending Review", bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-200", step: 1 },
  handled: { label: "2. Handled (Quote Sent)", bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200", step: 2 },
  paid: { label: "3. Payment Received", bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-200", step: 3 },
  packaged: { label: "4. Packaged & Ready", bg: "bg-indigo-100", text: "text-indigo-800", border: "border-indigo-200", step: 4 },
  dispatched: { label: "5. Dispatched", bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-200", step: 5 },
};

export function AdminOrdersList({ orders }: AdminOrdersListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // State for Pipeline Status Update Modal
  const [editingStatusOrder, setEditingStatusOrder] = useState<Order | null>(null);
  const [targetStatus, setTargetStatus] = useState<OrderStatus>("pending");
  const [estCourierInput, setEstCourierInput] = useState<string>("0");
  const [finalCourierInput, setFinalCourierInput] = useState<string>("0");
  const [modalError, setModalError] = useState<string | null>(null);

  // State for Delete Confirmation Modal
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);

  // State for Admin Notes Modal
  const [editingNoteOrder, setEditingNoteOrder] = useState<Order | null>(null);
  const [noteInput, setNoteInput] = useState<string>("");

  // Open Status update modal
  const openStatusModal = (order: Order) => {
    setEditingStatusOrder(order);
    const currentStatus = order.status || (order.handled ? "dispatched" : "pending");
    setTargetStatus(currentStatus);
    setEstCourierInput(
      order.estimated_courier_price !== null && order.estimated_courier_price !== undefined
        ? String(order.estimated_courier_price)
        : ""
    );
    setFinalCourierInput(
      order.final_courier_price !== null && order.final_courier_price !== undefined
        ? String(order.final_courier_price)
        : order.delivery_price !== null && order.delivery_price !== undefined
        ? String(order.delivery_price)
        : ""
    );
    setModalError(null);
  };

  // Open Note Modal
  const openNoteModal = (order: Order) => {
    setEditingNoteOrder(order);
    setNoteInput(order.notes ?? "");
  };

  // Submit Status Modal
  const handleSaveStatus = () => {
    if (!editingStatusOrder) return;

    const estVal = estCourierInput.trim() !== "" ? parseFloat(estCourierInput) : null;
    const finalVal = finalCourierInput.trim() !== "" ? parseFloat(finalCourierInput) : null;

    if (estVal !== null && (isNaN(estVal) || estVal < 0)) {
      setModalError("Estimated courier price must be a non-negative number.");
      return;
    }
    if (finalVal !== null && (isNaN(finalVal) || finalVal < 0)) {
      setModalError("Final courier price must be a non-negative number.");
      return;
    }

    startTransition(async () => {
      try {
        await updateOrderStatus(
          editingStatusOrder.id,
          targetStatus,
          estVal,
          finalVal
        );
        setEditingStatusOrder(null);
        router.refresh();
      } catch (err) {
        setModalError(err instanceof Error ? err.message : "Failed to update order status");
      }
    });
  };

  // Submit Soft Delete
  const handleConfirmDelete = () => {
    if (!deletingOrder) return;

    startTransition(async () => {
      try {
        await softDeleteOrder(deletingOrder.id);
        setDeletingOrder(null);
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to delete order");
      }
    });
  };

  // Submit Note Save
  const handleSaveNote = () => {
    if (!editingNoteOrder) return;

    startTransition(async () => {
      try {
        await updateOrderNotes(editingNoteOrder.id, noteInput);
        setEditingNoteOrder(null);
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to save note");
      }
    });
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const currentStatus: OrderStatus =
          order.status || (order.handled ? "dispatched" : "pending");
        const statusMeta = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.pending;

        const hasCustomerDetails =
          Boolean(order.customer_name) ||
          Boolean(order.customer_phone) ||
          Boolean(order.customer_address) ||
          Boolean(order.customer_pincode);

        // Two-step courier fee calculation logic
        const estCourier = order.estimated_courier_price ?? null;
        const finalCourier = order.final_courier_price ?? order.delivery_price ?? null;
        const effectiveCourier = finalCourier ?? estCourier ?? 0;
        const calculatedTotal = order.subtotal + effectiveCourier;

        return (
          <div
            key={order.id}
            className={`rounded-2xl border bg-white p-5 transition-all shadow-2xs ${
              currentStatus === "dispatched"
                ? "border-emerald-200/80 bg-emerald-50/20"
                : currentStatus === "pending"
                ? "border-amber-200/90 ring-1 ring-amber-100 bg-white"
                : "border-stone-200/80 bg-white"
            }`}
          >
            {/* Header / Meta */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
              <div className="flex items-center gap-3">
                <span className="font-mono text-base font-bold text-[#24211E]">
                  {order.order_ref}
                </span>
                <span className="text-xs text-stone-500 font-normal">
                  {formatDate(order.created_at)}
                </span>
              </div>

              {/* Status Badge (Clickable to open status modal) */}
              <button
                type="button"
                onClick={() => openStatusModal(order)}
                className={`rounded-full px-3 py-1 text-xs font-bold border transition-all hover:scale-105 ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}
                title="Click to update order pipeline status"
              >
                {statusMeta.label}
              </button>
            </div>

            {/* Customer Delivery Details (if provided) */}
            {hasCustomerDetails && (
              <div className="my-3 rounded-xl bg-blue-50/70 border border-blue-100 p-3 text-xs text-stone-800 space-y-1">
                <div className="font-semibold text-blue-900 flex items-center gap-1.5 mb-1.5">
                  <span>🚚</span> Customer Delivery Info
                </div>
                {order.customer_name && (
                  <div>
                    <span className="text-stone-500 font-medium">Name: </span>
                    <span className="font-semibold text-stone-900">{order.customer_name}</span>
                  </div>
                )}
                {order.customer_phone && (
                  <div>
                    <span className="text-stone-500 font-medium">Phone: </span>
                    <a href={`tel:${order.customer_phone}`} className="font-semibold text-blue-800 hover:underline">
                      {order.customer_phone}
                    </a>
                  </div>
                )}
                {order.customer_address && (
                  <div>
                    <span className="text-stone-500 font-medium">Address: </span>
                    <span className="font-medium text-stone-800 whitespace-pre-wrap">{order.customer_address}</span>
                  </div>
                )}
                {order.customer_pincode && (
                  <div>
                    <span className="text-stone-500 font-medium">Pincode: </span>
                    <span className="font-mono font-semibold text-stone-900">{order.customer_pincode}</span>
                  </div>
                )}
              </div>
            )}

            {/* Order Items */}
            <div className="py-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
                Items ({order.items ? order.items.length : 0})
              </div>
              <ul className="space-y-1.5 text-sm text-[#24211E]">
                {order.items &&
                  order.items.map((item, idx) => (
                    <li key={idx} className="flex justify-between items-center">
                      <span>
                        <span className="font-semibold">{item.name}</span>{" "}
                        <span className="text-stone-500 font-mono text-xs">× {item.qty}</span>
                      </span>
                      <span className="text-xs font-mono font-medium text-stone-700">
                        {formatINR(item.price * item.qty)}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>

            {/* Financial Breakdown (Subtotal + Estimated/Final Courier = Total) */}
            <div className="rounded-xl bg-stone-100/60 p-3.5 mt-1 text-sm space-y-1.5">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span className="font-semibold text-[#24211E]">{formatINR(order.subtotal)}</span>
              </div>

              {estCourier !== null && (
                <div className="flex justify-between text-stone-600 text-xs">
                  <span>Estimated Courier Charge</span>
                  <span className="font-semibold text-amber-800">{formatINR(estCourier)}</span>
                </div>
              )}

              {finalCourier !== null ? (
                <div className="flex justify-between text-stone-600 text-xs">
                  <span>Confirmed Final Courier Charge</span>
                  <span className="font-semibold text-emerald-800">{formatINR(finalCourier)}</span>
                </div>
              ) : (
                estCourier === null && (
                  <div className="text-xs text-amber-800 font-medium pt-0.5">
                    Courier charge to be estimated on handling
                  </div>
                )
              )}

              <div className="flex justify-between border-t border-stone-200/80 pt-1.5 font-bold text-[#24211E] text-base">
                <span>Total</span>
                <span className="text-emerald-700">{formatINR(calculatedTotal)}</span>
              </div>
            </div>

            {/* Admin Note Preview (if exists) */}
            {order.notes && (
              <div className="mt-3 rounded-xl bg-amber-50/80 border border-amber-200/70 p-3 text-xs text-amber-950">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-semibold text-amber-900 flex items-center gap-1">
                    <span>📝</span> Internal Note
                  </span>
                  <button
                    type="button"
                    onClick={() => openNoteModal(order)}
                    disabled={isPending}
                    className="text-stone-500 hover:text-[#C1662F] font-semibold text-[11px] transition-colors"
                  >
                    Edit Note
                  </button>
                </div>
                <p className="whitespace-pre-wrap font-sans text-stone-800 leading-relaxed">
                  {order.notes}
                </p>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-2 border-t border-stone-100 min-h-[44px]">
              {/* Quick Status Advance Button */}
              <button
                type="button"
                onClick={() => openStatusModal(order)}
                disabled={isPending}
                className="bg-stone-900 hover:bg-stone-800 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 min-h-[38px]"
              >
                <span>⚙️ Update Status / Courier Fee</span>
              </button>

              <div className="flex items-center gap-2">
                {/* Add Note Button */}
                {!order.notes && (
                  <button
                    type="button"
                    onClick={() => openNoteModal(order)}
                    disabled={isPending}
                    className="text-xs font-semibold text-stone-600 hover:text-[#C1662F] transition-colors px-2.5 py-1.5 rounded-lg hover:bg-stone-100 min-h-[36px] flex items-center gap-1"
                  >
                    <span>📝</span> Add Note
                  </button>
                )}

                {/* Soft Delete */}
                <button
                  type="button"
                  onClick={() => setDeletingOrder(order)}
                  disabled={isPending}
                  className="text-xs font-semibold text-red-600 hover:text-red-800 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50 min-h-[36px]"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* ── 5-Stage Pipeline & Courier Modal ────────────────────────────── */}
      {editingStatusOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs"
            onClick={() => setEditingStatusOrder(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl text-[#24211E]">
            <h3 className="text-lg font-bold text-[#24211E] mb-1">
              Update Order — {editingStatusOrder.order_ref}
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Subtotal: <span className="font-semibold text-stone-900">{formatINR(editingStatusOrder.subtotal)}</span>
            </p>

            {modalError && (
              <div className="mb-3 rounded-xl bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
                {modalError}
              </div>
            )}

            <div className="space-y-4">
              {/* Pipeline Stage Select */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Pipeline Stage
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as OrderStatus)}
                  className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm text-[#24211E] font-semibold bg-stone-50 focus:outline-none focus:ring-2 focus:ring-[#C1662F]"
                >
                  <option value="pending">1. Pending Review</option>
                  <option value="handled">2. Handled (Quote Sent)</option>
                  <option value="paid">3. Payment Received</option>
                  <option value="packaged">4. Packaged & Ready</option>
                  <option value="dispatched">5. Dispatched</option>
                </select>
              </div>

              {/* Estimated Courier Price */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Estimated Courier Price (₹) <span className="font-normal text-stone-400">(set on handling)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={estCourierInput}
                  onChange={(e) => setEstCourierInput(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm text-[#24211E] focus:outline-none focus:ring-2 focus:ring-[#C1662F]"
                  placeholder="e.g. 80"
                />
              </div>

              {/* Confirmed Final Courier Price */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Confirmed Final Courier Price (₹) <span className="font-normal text-stone-400">(set on dispatch)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={finalCourierInput}
                  onChange={(e) => setFinalCourierInput(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm text-[#24211E] focus:outline-none focus:ring-2 focus:ring-[#C1662F]"
                  placeholder="e.g. 75"
                />
              </div>

              {/* Total Preview */}
              <div className="rounded-xl bg-emerald-50 border border-emerald-200/60 p-3 text-xs flex justify-between items-center text-emerald-950 font-medium">
                <span>Calculated Total:</span>
                <span className="text-sm font-bold">
                  {formatINR(
                    editingStatusOrder.subtotal +
                      (finalCourierInput.trim() !== ""
                        ? parseFloat(finalCourierInput) || 0
                        : estCourierInput.trim() !== ""
                        ? parseFloat(estCourierInput) || 0
                        : 0)
                  )}
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStatusOrder(null)}
                  disabled={isPending}
                  className="flex-1 min-h-[44px] rounded-xl border border-stone-300 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveStatus}
                  disabled={isPending}
                  className="flex-1 min-h-[44px] rounded-xl bg-[#C1662F] hover:bg-[#A85524] active:bg-[#92481e] py-2.5 text-xs font-semibold text-white shadow-xs disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Save Pipeline Stage"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Admin Note Modal ────────────────────────────────────────────── */}
      {editingNoteOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs"
            onClick={() => setEditingNoteOrder(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl text-[#24211E]">
            <h3 className="text-lg font-bold text-[#24211E] mb-1">
              Admin Note — {editingNoteOrder.order_ref}
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Internal note (e.g. delivery preferences, customer requests). Only visible to admin.
            </p>

            <div className="space-y-4">
              <div>
                <textarea
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  rows={4}
                  placeholder="e.g. Wants delivery after 6pm, asked for smaller pot..."
                  className="w-full rounded-xl border border-stone-300 p-3 text-sm text-[#24211E] focus:outline-none focus:ring-2 focus:ring-[#C1662F] focus:border-transparent resize-none"
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingNoteOrder(null)}
                  disabled={isPending}
                  className="flex-1 min-h-[44px] rounded-xl border border-stone-300 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveNote}
                  disabled={isPending}
                  className="flex-1 min-h-[44px] rounded-xl bg-[#C1662F] hover:bg-[#A85524] active:bg-[#92481e] py-2.5 text-xs font-semibold text-white shadow-xs disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Save Note"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Soft Delete Modal ───────────────────────────────────────────── */}
      {deletingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs"
            onClick={() => setDeletingOrder(null)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl text-center text-[#24211E]">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 text-xl">
              ⚠️
            </div>
            <h3 className="text-base font-bold text-[#24211E] mb-1">
              Delete order {deletingOrder.order_ref}?
            </h3>
            <p className="text-xs text-stone-500 mb-6">
              This will hide order <span className="font-mono font-semibold">{deletingOrder.order_ref}</span> from the active list.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeletingOrder(null)}
                disabled={isPending}
                className="flex-1 min-h-[44px] rounded-xl border border-stone-300 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isPending}
                className="flex-1 min-h-[44px] rounded-xl bg-red-600 hover:bg-red-700 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                {isPending ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
