"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Order } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import { markOrderHandled, softDeleteOrder, updateOrderNotes } from "../actions";

interface AdminOrdersListProps {
  orders: Order[];
}

export function AdminOrdersList({ orders }: AdminOrdersListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // State for Delivery Price Modal
  const [handlingOrder, setHandlingOrder] = useState<Order | null>(null);
  const [deliveryInput, setDeliveryInput] = useState<string>("0");
  const [modalError, setModalError] = useState<string | null>(null);

  // State for Delete Confirmation Modal
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);

  // State for Admin Notes Modal
  const [editingNoteOrder, setEditingNoteOrder] = useState<Order | null>(null);
  const [noteInput, setNoteInput] = useState<string>("");

  // Open Handled modal
  const openHandledModal = (order: Order) => {
    setHandlingOrder(order);
    setDeliveryInput(
      order.delivery_price !== null && order.delivery_price !== undefined
        ? String(order.delivery_price)
        : "0"
    );
    setModalError(null);
  };

  // Open Note Modal
  const openNoteModal = (order: Order) => {
    setEditingNoteOrder(order);
    setNoteInput(order.notes ?? "");
  };

  // Submit Handled modal
  const handleSaveDelivery = () => {
    if (!handlingOrder) return;
    const parsedDelivery = parseFloat(deliveryInput);
    if (isNaN(parsedDelivery) || parsedDelivery < 0) {
      setModalError("Please enter a valid non-negative delivery price.");
      return;
    }

    startTransition(async () => {
      try {
        await markOrderHandled(handlingOrder.id, parsedDelivery);
        setHandlingOrder(null);
        router.refresh();
      } catch (err) {
        setModalError(err instanceof Error ? err.message : "Failed to update order");
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
        const isHandled = order.handled;

        return (
          <div
            key={order.id}
            className={`rounded-2xl border bg-white p-5 transition-all shadow-2xs ${
              isHandled
                ? "border-stone-200/80 bg-stone-50/50"
                : "border-amber-200/90 ring-1 ring-amber-100 bg-white"
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

              <div className="flex items-center gap-2">
                {isHandled ? (
                  <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold text-emerald-800">
                    Handled
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-semibold text-amber-800">
                    Pending
                  </span>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="py-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
                Items ({order.items ? order.items.length : 0})
              </div>
              <ul className="space-y-1.5 text-sm text-[#24211E]">
                {order.items && order.items.map((item, idx) => (
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

            {/* Financial Totals */}
            <div className="rounded-xl bg-stone-100/60 p-3.5 mt-1 text-sm space-y-1">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span className="font-semibold text-[#24211E]">{formatINR(order.subtotal)}</span>
              </div>

              {isHandled ? (
                <>
                  <div className="flex justify-between text-stone-600">
                    <span>Delivery</span>
                    <span className="font-semibold text-[#24211E]">
                      {formatINR(order.delivery_price || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-stone-200/80 pt-1.5 font-bold text-[#24211E] text-base">
                    <span>Final Total</span>
                    <span className="text-emerald-700">
                      {formatINR(order.final_total || order.subtotal)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-xs text-amber-800 font-medium pt-0.5">
                  Delivery to be calculated on handling
                </div>
              )}
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

            {/* Action Bar (Min 44px height tap targets) */}
            <div className="flex items-center justify-between pt-3 mt-2 border-t border-stone-100 min-h-[44px]">
              {/* Handled Checkbox / Button */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none py-1">
                <input
                  type="checkbox"
                  checked={isHandled}
                  onChange={() => openHandledModal(order)}
                  disabled={isPending}
                  className="h-4 w-4 rounded border-stone-300 text-[#C1662F] focus:ring-[#C1662F] cursor-pointer"
                />
                <span className="text-xs font-semibold text-stone-700 hover:text-[#24211E]">
                  {isHandled ? "Handled (Edit Delivery)" : "Mark as Handled"}
                </span>
              </label>

              <div className="flex items-center gap-2">
                {/* Add Note Button (if no note exists) */}
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

      {/* ── Delivery Price Modal ────────────────────────────────────────── */}
      {handlingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs"
            onClick={() => setHandlingOrder(null)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl text-[#24211E]">
            <h3 className="text-lg font-bold text-[#24211E] mb-1">
              Set Delivery Price
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Order <span className="font-mono font-semibold">{handlingOrder.order_ref}</span> · Subtotal: {formatINR(handlingOrder.subtotal)}
            </p>

            {modalError && (
              <div className="mb-3 rounded-xl bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
                {modalError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Delivery Price (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={deliveryInput}
                  onChange={(e) => setDeliveryInput(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm text-[#24211E] focus:outline-none focus:ring-2 focus:ring-[#C1662F]"
                  placeholder="0"
                  autoFocus
                />
              </div>

              {/* Total Preview */}
              <div className="rounded-xl bg-emerald-50 border border-emerald-200/60 p-3 text-xs flex justify-between items-center text-emerald-950">
                <span className="font-medium">Calculated Final Total:</span>
                <span className="text-sm font-bold">
                  {formatINR(
                    handlingOrder.subtotal + (parseFloat(deliveryInput) || 0)
                  )}
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setHandlingOrder(null)}
                  disabled={isPending}
                  className="flex-1 min-h-[44px] rounded-xl border border-stone-300 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveDelivery}
                  disabled={isPending}
                  className="flex-1 min-h-[44px] rounded-xl bg-[#C1662F] hover:bg-[#A85524] active:bg-[#92481e] py-2.5 text-xs font-semibold text-white shadow-xs disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Save & Mark Handled"}
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
