"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Order, OrderStatus } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import {
  updateOrderStatus,
  softDeleteOrder,
  updateOrderNotes,
  createManualOrder,
  type ManualOrderInput,
} from "../actions";
import {
  Package,
  CheckCircle2,
  Clock,
  Truck,
  CreditCard,
  Box,
  Plus,
  MessageCircle,
  FileText,
  Trash2,
  ExternalLink,
  X,
  User,
  MapPin,
  Phone,
  ChevronRight,
} from "lucide-react";

interface AdminOrdersListProps {
  orders: Order[];
}

type FilterTab = "all" | "active" | OrderStatus;

const PIPELINE_STAGES: OrderStatus[] = [
  "pending",
  "handled",
  "paid",
  "packaged",
  "dispatched",
];

const STATUS_CONFIG: Record<
  OrderStatus,
  {
    label: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    nextActionLabel: string | null;
  }
> = {
  pending: {
    label: "Pending Review",
    badgeBg: "bg-amber-100 dark:bg-amber-950/80",
    badgeText: "text-amber-800 dark:text-amber-300",
    badgeBorder: "border-amber-200/80 dark:border-amber-800/50",
    nextActionLabel: "Verify & Quote Courier →",
  },
  handled: {
    label: "Handled (Quote Sent)",
    badgeBg: "bg-blue-100 dark:bg-blue-950/80",
    badgeText: "text-blue-800 dark:text-blue-300",
    badgeBorder: "border-blue-200/80 dark:border-blue-800/50",
    nextActionLabel: "Mark as Paid →",
  },
  paid: {
    label: "Payment Received",
    badgeBg: "bg-purple-100 dark:bg-purple-950/80",
    badgeText: "text-purple-800 dark:text-purple-300",
    badgeBorder: "border-purple-200/80 dark:border-purple-800/50",
    nextActionLabel: "Mark as Packaged →",
  },
  packaged: {
    label: "Packaged & Ready",
    badgeBg: "bg-teal-100 dark:bg-teal-950/80",
    badgeText: "text-teal-800 dark:text-teal-300",
    badgeBorder: "border-teal-200/80 dark:border-teal-800/50",
    nextActionLabel: "Dispatch Shipment →",
  },
  dispatched: {
    label: "Dispatched (Completed)",
    badgeBg: "bg-emerald-100 dark:bg-emerald-950/80",
    badgeText: "text-emerald-800 dark:text-emerald-300",
    badgeBorder: "border-emerald-200/80 dark:border-emerald-800/50",
    nextActionLabel: null,
  },
};

export function AdminOrdersList({ orders }: AdminOrdersListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Active Filter Tab
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  // Customer Details Modal State
  const [customerModalOrder, setCustomerModalOrder] = useState<Order | null>(null);

  // Courier Charge Modal State
  const [courierModalOrder, setCourierModalOrder] = useState<Order | null>(null);
  const [courierTargetStatus, setCourierTargetStatus] = useState<"handled" | "dispatched">("handled");
  const [courierInputValue, setCourierInputValue] = useState<string>("0");
  const [courierModalError, setCourierModalError] = useState<string | null>(null);

  // Manual Order Modal State
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState<ManualOrderInput>({
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    customerPincode: "",
    itemSummary: "",
    subtotal: 0,
    status: "pending",
    estimatedCourierPrice: null,
    finalCourierPrice: null,
  });
  const [manualError, setManualError] = useState<string | null>(null);

  // Soft Delete Modal State
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);

  // Admin Notes Modal State
  const [editingNoteOrder, setEditingNoteOrder] = useState<Order | null>(null);
  const [noteInput, setNoteInput] = useState<string>("");

  // Live filter counts
  const counts = {
    all: orders.length,
    active: orders.filter((o) => (o.status || (o.handled ? "dispatched" : "pending")) !== "dispatched").length,
    pending: orders.filter((o) => (o.status || (o.handled ? "dispatched" : "pending")) === "pending").length,
    handled: orders.filter((o) => o.status === "handled").length,
    paid: orders.filter((o) => o.status === "paid").length,
    packaged: orders.filter((o) => o.status === "packaged").length,
    dispatched: orders.filter((o) => (o.status || (o.handled ? "dispatched" : "pending")) === "dispatched").length,
  };

  // Filtered orders list
  const filteredOrders = orders.filter((order) => {
    const status = order.status || (order.handled ? "dispatched" : "pending");
    if (activeFilter === "all") return true;
    if (activeFilter === "active") return status !== "dispatched";
    return status === activeFilter;
  });

  // Open Note Modal
  const openNoteModal = (order: Order) => {
    setEditingNoteOrder(order);
    setNoteInput(order.notes ?? "");
  };

  // Handler to open courier modal for advancing
  const initiateStatusTransition = (order: Order, nextStatus: OrderStatus) => {
    if (nextStatus === "handled") {
      setCourierModalOrder(order);
      setCourierTargetStatus("handled");
      setCourierInputValue(
        order.estimated_courier_price !== null && order.estimated_courier_price !== undefined
          ? String(order.estimated_courier_price)
          : "0"
      );
      setCourierModalError(null);
    } else if (nextStatus === "dispatched") {
      setCourierModalOrder(order);
      setCourierTargetStatus("dispatched");
      // Pre-fill with existing final courier or estimated courier
      const defaultVal =
        order.final_courier_price ?? order.estimated_courier_price ?? order.delivery_price ?? 0;
      setCourierInputValue(String(defaultVal));
      setCourierModalError(null);
    } else {
      // Direct update for paid or packaged or pending
      startTransition(async () => {
        try {
          await updateOrderStatus(order.id, nextStatus);
          router.refresh();
        } catch (err) {
          alert(err instanceof Error ? err.message : "Failed to update status");
        }
      });
    }
  };

  // Submit Courier Modal
  const handleSaveCourierModal = (overrideVal?: number) => {
    if (!courierModalOrder) return;

    const parsed = overrideVal !== undefined ? overrideVal : parseFloat(courierInputValue);
    if (isNaN(parsed) || parsed < 0) {
      setCourierModalError("Please enter a valid non-negative courier charge.");
      return;
    }

    startTransition(async () => {
      try {
        if (courierTargetStatus === "handled") {
          await updateOrderStatus(courierModalOrder.id, "handled", parsed, null);
        } else {
          await updateOrderStatus(courierModalOrder.id, "dispatched", undefined, parsed);
        }
        setCourierModalOrder(null);
        router.refresh();
      } catch (err) {
        setCourierModalError(err instanceof Error ? err.message : "Failed to update courier charge.");
      }
    });
  };

  // Submit Manual Order Creation Form
  const handleCreateManualOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.itemSummary.trim()) {
      setManualError("Please provide an item summary.");
      return;
    }
    if (manualForm.subtotal <= 0) {
      setManualError("Please provide a valid subtotal amount greater than 0.");
      return;
    }

    startTransition(async () => {
      const res = await createManualOrder(manualForm);
      if (!res.success) {
        setManualError(res.error || "Failed to create manual order.");
      } else {
        setShowManualModal(false);
        setManualForm({
          customerName: "",
          customerPhone: "",
          customerAddress: "",
          customerPincode: "",
          itemSummary: "",
          subtotal: 0,
          status: "pending",
          estimatedCourierPrice: null,
          finalCourierPrice: null,
        });
        router.refresh();
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

  // Open WhatsApp to customer phone number
  const handleOpenWhatsAppCustomer = (phone?: string | null, orderRef?: string) => {
    if (!phone) {
      alert("No phone number recorded for this customer.");
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const msg = `Hello, regarding your Haritham Garden order ${orderRef || ""}...`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* ── Top Action Header & Filter Pills ──────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-white dark:bg-stone-900 p-1.5 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-2xs overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeFilter === "all"
                ? "bg-botanical-800 dark:bg-botanical-600 text-white shadow-xs"
                : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
            }`}
          >
            All ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("active")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeFilter === "active"
                ? "bg-terracotta text-white shadow-xs"
                : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
            }`}
          >
            Active ({counts.active})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("pending")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeFilter === "pending"
                ? "bg-amber-500 text-white shadow-xs"
                : "text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
            }`}
          >
            Pending ({counts.pending})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("handled")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeFilter === "handled"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30"
            }`}
          >
            Handled ({counts.handled})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("paid")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeFilter === "paid"
                ? "bg-purple-600 text-white shadow-xs"
                : "text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30"
            }`}
          >
            Paid ({counts.paid})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("packaged")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeFilter === "packaged"
                ? "bg-teal-600 text-white shadow-xs"
                : "text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/30"
            }`}
          >
            Packaged ({counts.packaged})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("dispatched")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeFilter === "dispatched"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            }`}
          >
            Completed ({counts.dispatched})
          </button>
        </div>

        {/* Add Manual Order Button */}
        <button
          type="button"
          onClick={() => {
            setManualError(null);
            setShowManualModal(true);
          }}
          className="bg-terracotta hover:bg-[#b04a25] text-white px-4 py-2.5 rounded-2xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 shrink-0 min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Manual Order</span>
        </button>
      </div>

      {/* ── Orders Feed List ──────────────────────────────────────────────── */}
      {filteredOrders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-300 dark:border-stone-800 p-12 text-center text-stone-400 dark:text-stone-500 bg-white dark:bg-stone-900">
          <Package className="w-10 h-10 mx-auto mb-2 text-stone-300 dark:text-stone-600" />
          <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">
            No orders match this filter
          </p>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
            Try switching to &quot;All&quot; or create a manual order.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const currentStatus: OrderStatus =
              order.status || (order.handled ? "dispatched" : "pending");
            const statusConfig = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.pending;
            const stageIndex = PIPELINE_STAGES.indexOf(currentStatus);
            const nextStatus = stageIndex < PIPELINE_STAGES.length - 1 ? PIPELINE_STAGES[stageIndex + 1] : null;

            // Two-step courier fees
            const estCourier = order.estimated_courier_price ?? null;
            const finalCourier = order.final_courier_price ?? order.delivery_price ?? null;
            const effectiveCourier = finalCourier ?? estCourier ?? 0;
            const calculatedTotal = order.subtotal + effectiveCourier;

            return (
              <div
                key={order.id}
                className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/90 dark:border-stone-800 shadow-2xs hover:shadow-md transition-all overflow-hidden"
              >
                {/* 1. Order Card Header */}
                <div className="p-6 pb-4 flex items-center justify-between border-b border-stone-100 dark:border-stone-800 flex-wrap gap-3 bg-stone-50/50 dark:bg-stone-900/50">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-heading font-bold text-lg text-stone-900 dark:text-stone-100 tracking-tight">
                      {order.order_ref}
                    </span>
                    <span className="text-xs text-stone-400 dark:text-stone-500 font-medium">
                      {formatDate(order.created_at)}
                    </span>

                    {/* Customer Name Trigger Link/Badge */}
                    {order.customer_name ? (
                      <button
                        type="button"
                        onClick={() => setCustomerModalOrder(order)}
                        className="flex items-center gap-1.5 bg-botanical-50 dark:bg-stone-800 px-3 py-1 rounded-xl border border-botanical-100 dark:border-stone-700 text-xs font-bold text-botanical-800 dark:text-botanical-100 hover:text-terracotta transition-colors"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>{order.customer_name}</span>
                        <span className="text-[11px] underline ml-1">Details</span>
                      </button>
                    ) : (
                      <span className="text-xs text-stone-400 italic">No customer name</span>
                    )}
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`text-xs font-bold px-3.5 py-1 rounded-full border ${statusConfig.badgeBg} ${statusConfig.badgeText} ${statusConfig.badgeBorder}`}
                  >
                    {statusConfig.label}
                  </span>
                </div>

                {/* 2. Order Items & Financial Box */}
                <div className="p-6 space-y-4">
                  {/* Items List */}
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 block mb-2">
                      Items ({order.items ? order.items.length : 0})
                    </span>
                    <ul className="space-y-1.5 text-xs text-stone-800 dark:text-stone-200">
                      {order.items &&
                        order.items.map((item, idx) => (
                          <li key={idx} className="flex justify-between items-center">
                            <span>
                              <span className="font-semibold text-stone-900 dark:text-stone-100">
                                {item.name}
                              </span>{" "}
                              <span className="text-stone-400 font-mono">× {item.qty}</span>
                            </span>
                            <span className="font-mono font-semibold text-stone-700 dark:text-stone-300">
                              {formatINR(item.price * item.qty)}
                            </span>
                          </li>
                        ))}
                    </ul>
                  </div>

                  {/* Financial Breakdown Container */}
                  <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 space-y-1.5 text-xs">
                    <div className="flex justify-between text-stone-600 dark:text-stone-400 font-medium">
                      <span>Subtotal</span>
                      <span className="font-semibold text-stone-900 dark:text-stone-100">
                        {formatINR(order.subtotal)}
                      </span>
                    </div>

                    {/* Courier Charge Line */}
                    {finalCourier !== null ? (
                      <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-semibold">
                        <span>Final Courier (confirmed)</span>
                        <span>{formatINR(finalCourier)}</span>
                      </div>
                    ) : estCourier !== null ? (
                      <div className="flex justify-between text-amber-700 dark:text-amber-400 font-semibold">
                        <span>Estimated Courier (pending)</span>
                        <span>{formatINR(estCourier)}</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-stone-400 italic">
                        Courier charge to be estimated on handling
                      </div>
                    )}

                    {/* Total Line */}
                    <div className="pt-2 border-t border-stone-200 dark:border-stone-700 flex justify-between items-center font-bold text-stone-900 dark:text-stone-100 text-sm">
                      <span>Total</span>
                      <span className="text-botanical-800 dark:text-botanical-100 text-base">
                        {formatINR(calculatedTotal)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Internal Admin Note Display */}
                {order.notes && (
                  <div className="px-6 pb-3">
                    <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/30 flex items-start justify-between gap-2 text-xs text-amber-950 dark:text-amber-300">
                      <div>
                        <span className="font-bold block mb-0.5">📝 Nursery Note:</span>
                        <p className="whitespace-pre-wrap text-stone-800 dark:text-stone-200">
                          {order.notes}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openNoteModal(order)}
                        className="text-stone-400 hover:text-terracotta p-1"
                        title="Edit note"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* 4. Order Card Footer Controls */}
                <div className="px-6 py-4 bg-stone-50/60 dark:bg-stone-900 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between flex-wrap gap-3">
                  {/* Left: Status Selector & Advance Button */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Direct Stage Select */}
                    <select
                      value={currentStatus}
                      onChange={(e) =>
                        initiateStatusTransition(order, e.target.value as OrderStatus)
                      }
                      className="px-3 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-800 dark:text-stone-100 focus:outline-none cursor-pointer"
                    >
                      <option value="pending">1. Pending Review</option>
                      <option value="handled">2. Handled (Quote Sent)</option>
                      <option value="paid">3. Payment Received</option>
                      <option value="packaged">4. Packaged & Ready</option>
                      <option value="dispatched">5. Dispatched (Completed)</option>
                    </select>

                    {/* Step Advance Button */}
                    {nextStatus && (
                      <button
                        type="button"
                        onClick={() => initiateStatusTransition(order, nextStatus)}
                        disabled={isPending}
                        className="bg-botanical-800 hover:bg-botanical-900 dark:bg-botanical-600 dark:hover:bg-botanical-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 min-h-[36px]"
                      >
                        <span>{STATUS_CONFIG[currentStatus].nextActionLabel}</span>
                      </button>
                    )}
                  </div>

                  {/* Right: Actions (WhatsApp, Admin Note, Soft Delete) */}
                  <div className="flex items-center gap-3.5 ml-auto">
                    {/* WhatsApp Direct Chat */}
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenWhatsAppCustomer(order.customer_phone, order.order_ref)
                      }
                      className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline min-h-[36px]"
                      title="Open WhatsApp chat with customer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>WhatsApp</span>
                    </button>

                    {/* Add / Edit Note */}
                    <button
                      type="button"
                      onClick={() => openNoteModal(order)}
                      className="flex items-center gap-1 text-xs font-semibold text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 min-h-[36px]"
                    >
                      <FileText className="w-4 h-4 text-stone-400" />
                      <span>{order.notes ? "Edit Note" : "Add Note"}</span>
                    </button>

                    {/* Soft Delete */}
                    <button
                      type="button"
                      onClick={() => setDeletingOrder(order)}
                      className="flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-800 min-h-[36px]"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL 1: Customer Info Details Modal ──────────────────────────── */}
      {customerModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs"
            onClick={() => setCustomerModalOrder(null)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-3xl bg-white dark:bg-stone-900 p-6 shadow-xl text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3 mb-4">
              <h3 className="font-heading font-bold text-base flex items-center gap-2">
                <User className="w-4 h-4 text-botanical-600" />
                <span>Customer Info — {customerModalOrder.order_ref}</span>
              </h3>
              <button
                type="button"
                onClick={() => setCustomerModalOrder(null)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-stone-400 font-medium block">Full Name:</span>
                <span className="font-bold text-stone-800 dark:text-stone-200 text-sm">
                  {customerModalOrder.customer_name || "Not provided"}
                </span>
              </div>

              <div>
                <span className="text-stone-400 font-medium block">Phone Number:</span>
                {customerModalOrder.customer_phone ? (
                  <a
                    href={`tel:${customerModalOrder.customer_phone}`}
                    className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{customerModalOrder.customer_phone}</span>
                  </a>
                ) : (
                  <span className="text-stone-500 italic">Not provided</span>
                )}
              </div>

              <div>
                <span className="text-stone-400 font-medium block">Delivery Address:</span>
                {customerModalOrder.customer_address ? (
                  <p className="font-medium text-stone-800 dark:text-stone-200 whitespace-pre-wrap mt-0.5">
                    {customerModalOrder.customer_address}
                  </p>
                ) : (
                  <span className="text-stone-500 italic">Not provided</span>
                )}
              </div>

              <div>
                <span className="text-stone-400 font-medium block">Pincode:</span>
                <span className="font-mono font-semibold text-stone-800 dark:text-stone-200">
                  {customerModalOrder.customer_pincode || "Not provided"}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-end">
              <button
                type="button"
                onClick={() => setCustomerModalOrder(null)}
                className="bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-200 px-4 py-2 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: Courier Charge Modal (Estimated or Final) ────────────── */}
      {courierModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs"
            onClick={() => setCourierModalOrder(null)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-3xl bg-white dark:bg-stone-900 p-6 shadow-xl text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800">
            <h3 className="font-heading font-bold text-lg mb-1">
              {courierTargetStatus === "handled"
                ? "Set Estimated Courier Charge"
                : "Confirm Final Courier Charge"}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
              Order <span className="font-mono font-semibold">{courierModalOrder.order_ref}</span> · Items Subtotal: {formatINR(courierModalOrder.subtotal)}
            </p>

            {courierModalError && (
              <div className="mb-3 rounded-xl bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
                {courierModalError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  {courierTargetStatus === "handled"
                    ? "Estimated Courier Price (₹)"
                    : "Final Courier Price (₹)"}
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={courierInputValue}
                  onChange={(e) => setCourierInputValue(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-2.5 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-botanical-600"
                  placeholder="0"
                  autoFocus
                />
              </div>

              {/* Quick "No Change" Button for Final Courier */}
              {courierTargetStatus === "dispatched" && (
                <button
                  type="button"
                  onClick={() => {
                    const est = courierModalOrder.estimated_courier_price ?? 0;
                    handleSaveCourierModal(est);
                  }}
                  className="w-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 py-2 rounded-xl text-xs font-semibold transition-colors"
                >
                  ⚡ No Change (Reuse Estimated: {formatINR(courierModalOrder.estimated_courier_price ?? 0)})
                </button>
              )}

              {/* Calculated Total Preview */}
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3 text-xs flex justify-between items-center text-emerald-950 dark:text-emerald-300">
                <span className="font-medium">Calculated Order Total:</span>
                <span className="text-sm font-bold">
                  {formatINR(
                    courierModalOrder.subtotal + (parseFloat(courierInputValue) || 0)
                  )}
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCourierModalOrder(null)}
                  disabled={isPending}
                  className="flex-1 min-h-[44px] rounded-xl border border-stone-300 dark:border-stone-700 py-2.5 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveCourierModal()}
                  disabled={isPending}
                  className="flex-1 min-h-[44px] rounded-xl bg-terracotta hover:bg-[#b04a25] py-2.5 text-xs font-semibold text-white shadow-xs disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Save & Update Stage"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: Add Manual Order Form Modal ──────────────────────────── */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs"
            onClick={() => setShowManualModal(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-3xl bg-white dark:bg-stone-900 p-6 shadow-xl text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3 mb-4">
              <h3 className="font-heading font-bold text-lg flex items-center gap-2">
                <Plus className="w-5 h-5 text-terracotta" />
                <span>Create Manual Order (Phone / In-Person)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {manualError && (
              <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                {manualError}
              </div>
            )}

            <form onSubmit={handleCreateManualOrderSubmit} className="space-y-4 text-xs">
              {/* Customer Name */}
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={manualForm.customerName || ""}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, customerName: e.target.value })
                  }
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-2.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-botanical-600"
                />
              </div>

              {/* Customer Phone */}
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Customer Phone
                </label>
                <input
                  type="tel"
                  value={manualForm.customerPhone || ""}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, customerPhone: e.target.value })
                  }
                  placeholder="e.g. 9847012345"
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-2.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-botanical-600"
                />
              </div>

              {/* Delivery Address */}
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Delivery Address
                </label>
                <textarea
                  rows={2}
                  value={manualForm.customerAddress || ""}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, customerAddress: e.target.value })
                  }
                  placeholder="e.g. House No. 12, MG Road, Ernakulam"
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-botanical-600 resize-none"
                />
              </div>

              {/* Pincode */}
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Pincode
                </label>
                <input
                  type="text"
                  value={manualForm.customerPincode || ""}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, customerPincode: e.target.value })
                  }
                  placeholder="e.g. 682001"
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-botanical-600"
                />
              </div>

              {/* Item Summary (Free Text) */}
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Item Summary <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={manualForm.itemSummary}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, itemSummary: e.target.value })
                  }
                  placeholder="e.g. 2x Pink Anthurium, 1x Coco-Peat Pot"
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-2.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-botanical-600"
                />
              </div>

              {/* Subtotal & Initial Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Items Subtotal (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={manualForm.subtotal || ""}
                    onChange={(e) =>
                      setManualForm({
                        ...manualForm,
                        subtotal: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="350"
                    className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-botanical-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Initial Status
                  </label>
                  <select
                    value={manualForm.status}
                    onChange={(e) =>
                      setManualForm({
                        ...manualForm,
                        status: e.target.value as OrderStatus,
                      })
                    }
                    className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-botanical-600"
                  >
                    <option value="pending">1. Pending Review</option>
                    <option value="handled">2. Handled</option>
                    <option value="paid">3. Paid</option>
                    <option value="packaged">4. Packaged</option>
                    <option value="dispatched">5. Dispatched</option>
                  </select>
                </div>
              </div>

              {/* Submit Actions */}
              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  disabled={isPending}
                  className="flex-1 min-h-[44px] rounded-xl border border-stone-300 dark:border-stone-700 py-2.5 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 min-h-[44px] rounded-xl bg-terracotta hover:bg-[#b04a25] py-2.5 text-xs font-semibold text-white shadow-xs disabled:opacity-50"
                >
                  {isPending ? "Creating..." : "Create Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 4: Admin Notes Modal ───────────────────────────────────── */}
      {editingNoteOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs"
            onClick={() => setEditingNoteOrder(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-3xl bg-white dark:bg-stone-900 p-6 shadow-xl text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800">
            <h3 className="font-heading font-bold text-base mb-1">
              Admin Note — {editingNoteOrder.order_ref}
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Internal note (e.g. delivery preferences, customer requests). Only visible to admin.
            </p>

            <div className="space-y-4">
              <textarea
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                rows={4}
                placeholder="e.g. Customer requested delivery after 6pm..."
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 p-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-botanical-600 resize-none"
                autoFocus
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingNoteOrder(null)}
                  disabled={isPending}
                  className="flex-1 min-h-[44px] rounded-xl border border-stone-300 dark:border-stone-700 py-2.5 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveNote}
                  disabled={isPending}
                  className="flex-1 min-h-[44px] rounded-xl bg-terracotta hover:bg-[#b04a25] py-2.5 text-xs font-semibold text-white shadow-xs disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Save Note"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 5: Soft Delete Confirmation Modal ───────────────────────── */}
      {deletingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs"
            onClick={() => setDeletingOrder(null)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-3xl bg-white dark:bg-stone-900 p-6 shadow-xl text-center text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 text-xl">
              ⚠️
            </div>
            <h3 className="font-heading font-bold text-base mb-1">
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
                className="flex-1 min-h-[44px] rounded-xl border border-stone-300 dark:border-stone-700 py-2.5 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50"
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
