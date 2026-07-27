"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import type { Order, OrderStatus, Plant, SiteSettings } from "@/lib/types";
import { formatINR, formatDate } from "@/lib/utils";
import { getEffectivePrice } from "@/lib/types";
import { getLocalOrderUuids } from "@/lib/myOrdersStorage";
import { fetchCustomerOrdersByUuids, updateCustomerOrderItemsByCustomer, cancelCustomerOrder } from "@/app/actions/customerOrders";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PlantSearchPicker } from "@/components/PlantSearchPicker";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import {
  PackageCheck,
  ShoppingBag,
  ArrowLeft,
  Pencil,
  Plus,
  Trash2,
  Search,
  Lock,
  MessageCircle,
  Clock,
  CheckCircle2,
  Truck,
  Box,
  CreditCard,
  AlertCircle,
  RefreshCw,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { useCart } from "@/context/CartContext";

const CUSTOMER_STATUS_MAP: Record<
  OrderStatus,
  { label: string; bg: string; text: string; border: string; icon: any }
> = {
  pending: {
    label: "Order Received",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
    icon: Clock,
  },
  handled: {
    label: "Order Confirmed",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
    icon: CheckCircle2,
  },
  paid: {
    label: "Being Prepared",
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-200 dark:border-indigo-800",
    icon: CreditCard,
  },
  packaged: {
    label: "Being Prepared",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
    icon: Box,
  },
  dispatched: {
    label: "On Its Way",
    bg: "bg-botanical-50 dark:bg-stone-800",
    text: "text-botanical-800 dark:text-botanical-100",
    border: "border-botanical-200 dark:border-stone-700",
    icon: Truck,
  },
};

interface MyOrdersClientProps {
  siteSettings: SiteSettings | null;
  plants: Plant[];
}

type DraftItem = {
  plant_id?: string;
  name: string;
  price: number;
  qty: number;
};

export function MyOrdersClient({ siteSettings, plants }: MyOrdersClientProps) {
  const { totalItems, openCart } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Item Editing state
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<DraftItem[]>([]);
  const [plantSearchQuery, setPlantSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [editingError, setEditingError] = useState<string | null>(null);

  // Track order that was just updated to present WhatsApp notification banner
  const [justUpdatedOrder, setJustUpdatedOrder] = useState<Order | null>(null);

  // Cancellation state
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [justCancelledOrder, setJustCancelledOrder] = useState<Order | null>(null);

  const handleConfirmCancelOrder = async () => {
    if (!cancellingOrder) return;
    setCancelError(null);
    const localUuids = getLocalOrderUuids();

    startTransition(async () => {
      try {
        await cancelCustomerOrder(cancellingOrder.id, localUuids, cancellingOrder.updated_at);
        setJustCancelledOrder(cancellingOrder);
        setCancellingOrder(null);
        await loadOrders();
      } catch (err) {
        setCancelError(err instanceof Error ? err.message : "Failed to cancel order.");
      }
    });
  };

  const generateWhatsAppCancelUrl = (order: Order) => {
    const targetNumber = siteSettings?.whatsapp_number || "919497723456";
    const message = `Hi! 👋 I'd like to cancel my order *${order.order_ref}*, please disregard it. Thank you!`;
    return buildWhatsAppUrl(targetNumber, message);
  };

  const loadOrders = async () => {
    setLoading(true);
    const uuids = getLocalOrderUuids();
    if (uuids.length === 0) {
      setOrders([]);
      setLoading(false);
      return;
    }
    const data = await fetchCustomerOrdersByUuids(uuids);
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const [editingOrderUpdatedAt, setEditingOrderUpdatedAt] = useState<string | null>(null);

  const startEditing = (order: Order) => {
    setEditingOrderId(order.id);
    setEditingOrderUpdatedAt(order.updated_at || null);
    setEditingError(null);
    setEditingDraft(
      (order.items || []).map((i) => ({
        plant_id: i.plant_id || "",
        name: i.name,
        price: i.price,
        qty: i.qty,
      }))
    );
    setPlantSearchQuery("");
    setIsSearchOpen(false);
  };

  const cancelEditing = () => {
    setEditingOrderId(null);
    setEditingDraft([]);
    setEditingError(null);
    setPlantSearchQuery("");
    setIsSearchOpen(false);
  };

  const handleUpdateQty = (identifier: string, newQty: number) => {
    if (newQty <= 0) {
      setEditingDraft((prev) =>
        prev.filter((i) => (i.plant_id ? i.plant_id !== identifier : i.name !== identifier))
      );
    } else {
      setEditingDraft((prev) =>
        prev.map((i) =>
          (i.plant_id ? i.plant_id === identifier : i.name === identifier)
            ? { ...i, qty: newQty }
            : i
        )
      );
    }
  };

  const handleAddPlantToDraft = (plant: Plant) => {
    if (plant.availability === "unavailable") return;
    const effectivePrice = getEffectivePrice(plant);
    setEditingDraft((prev) => {
      const existing = prev.find((i) => i.plant_id === plant.id);
      if (existing) {
        return prev.map((i) =>
          i.plant_id === plant.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [
        ...prev,
        {
          plant_id: plant.id,
          name: plant.name,
          price: effectivePrice,
          qty: 1,
        },
      ];
    });
    setPlantSearchQuery("");
    setIsSearchOpen(false);
  };

  const handleSaveOrderItems = (orderId: string) => {
    setEditingError(null);
    if (editingDraft.length === 0) {
      setEditingError("Your order must contain at least one plant item.");
      return;
    }

    const localUuids = getLocalOrderUuids();

    startTransition(async () => {
      try {
        await updateCustomerOrderItemsByCustomer(
          orderId,
          localUuids,
          editingDraft.map((i) => ({
            plant_id: i.plant_id,
            name: i.name,
            price: i.price,
            qty: i.qty,
          })),
          editingOrderUpdatedAt
        );
        setEditingOrderId(null);
        setEditingDraft([]);
        // Reload orders list
        await loadOrders();
        // Find updated order to trigger WhatsApp prompt
        const updated = orders.find((o) => o.id === orderId);
        if (updated) {
          setJustUpdatedOrder({
            ...updated,
            items: editingDraft.map((i) => ({ plant_id: i.plant_id || "", name: i.name, price: i.price, qty: i.qty })),
            subtotal: editingDraft.reduce((s, i) => s + i.price * i.qty, 0),
          });
        }
      } catch (err) {
        setEditingError(err instanceof Error ? err.message : "Failed to update order items.");
      }
    });
  };

  const generateWhatsAppEditUrl = (order: Order) => {
    const targetNumber = siteSettings?.whatsapp_number || "919497723456";
    const itemListStr = (order.items || [])
      .map((i) => `• ${i.name} x${i.qty} — ₹${i.price * i.qty}`)
      .join("\n");

    const message = `Hello! 👋 I just updated my order *${order.order_ref}* on your website.

Updated Items:
${itemListStr}

Subtotal: ₹${order.subtotal}
${order.customer_name ? `Customer: ${order.customer_name}` : ""}

Please confirm my updated order details. Thank you!`;

    return buildWhatsAppUrl(targetNumber, message);
  };

  const activeOrders = orders.filter((o) => !o.deleted);
  const cancelledOrders = orders.filter((o) => o.deleted);

  return (
    <div className="bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-100 font-sans antialiased min-h-screen flex flex-col relative transition-colors duration-300">
      {/* Navbar Header */}
      <header className="sticky top-0 z-40 bg-stone-50/80 dark:bg-stone-950/80 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Logo
            showTagline={true}
            businessName={siteSettings?.business_name}
            tagline={siteSettings?.tagline}
            logoUrl={siteSettings?.logo_url}
            href="/"
          />

          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link
              href="/"
              className="p-2.5 rounded-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-200 hover:border-botanical-600 transition-all shadow-2xs flex items-center gap-1.5 px-3.5 min-h-[44px] text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4 text-stone-500" />
              <span>Back to Shop</span>
            </Link>
            <ThemeToggle />
            <button
              type="button"
              onClick={openCart}
              className="relative p-2.5 rounded-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-200 hover:border-botanical-600 active:scale-95 transition-all shadow-2xs flex items-center gap-2 px-4 min-h-[44px]"
              aria-label={`Shopping Bag with ${totalItems} items`}
            >
              <ShoppingBag className="w-5 h-5 text-botanical-800 dark:text-botanical-100" />
              <span className="text-sm font-semibold hidden sm:inline">Bag</span>
              <span className="bg-terracotta text-white font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-stone-200 dark:border-stone-800">
          <div>
            <h1 className="font-heading font-bold text-2xl sm:text-3xl text-stone-900 dark:text-stone-100 flex items-center gap-2.5">
              <PackageCheck className="w-7 h-7 text-botanical-800 dark:text-botanical-100" />
              My Orders
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Orders placed from this browser device. No login required.
            </p>
          </div>

          <button
            type="button"
            onClick={loadOrders}
            className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:text-terracotta transition-colors text-xs font-semibold flex items-center gap-1.5"
            title="Refresh orders"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* WhatsApp Notification Banner (after edit saved) */}
        {justUpdatedOrder && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between flex-wrap gap-3 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-300">
                ✓
              </div>
              <div>
                <h4 className="font-bold text-sm text-emerald-950 dark:text-emerald-100">
                  Order Items Updated!
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Notify us on WhatsApp so we can confirm your revised order request right away.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={generateWhatsAppEditUrl(justUpdatedOrder)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Notify Shop on WhatsApp</span>
              </a>
              <button
                type="button"
                onClick={() => setJustUpdatedOrder(null)}
                className="p-2 text-emerald-600 hover:text-emerald-800 text-xs font-bold"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* WhatsApp Notification Banner (after order cancelled) */}
        {justCancelledOrder && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 flex items-center justify-between flex-wrap gap-3 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/60 flex items-center justify-center shrink-0 text-rose-600 dark:text-rose-300">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-rose-950 dark:text-rose-100">
                  Order {justCancelledOrder.order_ref} Cancelled
                </h4>
                <p className="text-xs text-rose-700 dark:text-rose-300">
                  Optionally let us know on WhatsApp so we can update our records right away.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={generateWhatsAppCancelUrl(justCancelledOrder)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Notify Shop on WhatsApp</span>
              </a>
              <button
                type="button"
                onClick={() => setJustCancelledOrder(null)}
                className="p-2 text-rose-600 hover:text-rose-800 text-xs font-bold"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Content States */}
        {loading ? (
          <div className="py-16 text-center text-stone-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-botanical-800 dark:text-botanical-100" />
            <p className="text-sm font-semibold">Loading your orders…</p>
          </div>
        ) : orders.length === 0 ? (
          /* Empty State */
          <div className="py-16 text-center space-y-5 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/90 dark:border-stone-800 p-8 shadow-2xs">
            <div className="w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400 flex items-center justify-center mx-auto text-3xl">
              🌿
            </div>
            <div className="space-y-1.5">
              <h3 className="font-heading font-bold text-xl text-stone-900 dark:text-stone-100">
                No Orders Placed Yet
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto leading-relaxed">
                Orders you place on this device will automatically appear here so you can check status and manage your order items.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-terracotta hover:bg-[#b04a25] text-white font-semibold text-sm shadow-md transition-all active:scale-95"
            >
              Browse Plant Catalogue
            </Link>
          </div>
        ) : (
          /* Orders List */
          <div className="space-y-8">
            {/* Active Orders Section */}
            {activeOrders.length === 0 && cancelledOrders.length > 0 ? (
              <div className="p-8 text-center bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 space-y-2">
                <h4 className="font-bold text-base text-stone-800 dark:text-stone-200">No Active Orders</h4>
                <p className="text-xs text-stone-500">All orders placed from this device have been cancelled.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {activeOrders.map((order) => {
              const statusCfg = CUSTOMER_STATUS_MAP[order.status] || CUSTOMER_STATUS_MAP.pending;
              const StatusIcon = statusCfg.icon;
              const canEdit = order.status === "pending" || order.status === "handled";
              const isEditing = editingOrderId === order.id;

              const estCourier = order.estimated_courier_price ?? null;
              const finalCourier = order.final_courier_price ?? order.delivery_price ?? null;
              const effectiveCourier = finalCourier ?? estCourier ?? 0;
              const discountApplied = order.discount_amount_applied ?? 0;
              const calculatedTotal = order.subtotal - discountApplied + effectiveCourier;

              return (
                <div
                  key={order.id}
                  className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/90 dark:border-stone-800 shadow-2xs hover:shadow-md transition-all overflow-hidden"
                >
                  {/* Order Card Header */}
                  <div className="p-6 pb-4 flex items-center justify-between border-b border-stone-100 dark:border-stone-800 flex-wrap gap-3 bg-stone-50/50 dark:bg-stone-900/50">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-heading font-bold text-lg text-stone-900 dark:text-stone-100 tracking-tight">
                        {order.order_ref}
                      </span>
                      <span className="text-xs text-stone-400 dark:text-stone-500 font-medium">
                        {formatDate(order.created_at)}
                      </span>

                      {order.items_edited_at && (
                        <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Pencil className="w-2.5 h-2.5" />
                          Edited {formatDate(order.items_edited_at)}
                        </span>
                      )}
                    </div>

                    {/* Customer Status Badge */}
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span>{statusCfg.label}</span>
                    </div>
                  </div>

                  {/* Order Body & Items */}
                  <div className="p-6 space-y-4">
                    {/* Items Section */}
                    {isEditing ? (
                      /* Editing Mode */
                      <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 space-y-3">
                        <div className="flex justify-between items-center flex-wrap gap-2">
                          <span className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                            <Pencil className="w-3.5 h-3.5 text-terracotta" />
                            Edit Your Order Items
                          </span>
                          <span className="text-[11px] font-semibold text-stone-600 dark:text-stone-300 font-mono">
                            Subtotal: {formatINR(editingDraft.reduce((s, i) => s + i.price * i.qty, 0))}
                          </span>
                        </div>

                        {editingError && (
                          <div className="text-[11px] font-semibold text-red-600 dark:text-red-400">
                            {editingError}
                          </div>
                        )}

                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {editingDraft.map((item) => (
                            <div
                              key={item.plant_id || item.name}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs shadow-2xs"
                            >
                              <div className="min-w-0 pr-2">
                                <span className="font-bold text-stone-900 dark:text-stone-100 block truncate">
                                  {item.name}
                                </span>
                                <span className="text-[10px] text-stone-400 font-mono">
                                  {formatINR(item.price)} each
                                </span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <div className="flex items-center gap-1 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-1.5 py-0.5">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateQty(item.plant_id || item.name, item.qty - 1)}
                                    className="w-5 h-5 flex items-center justify-center font-bold text-stone-600 dark:text-stone-300 hover:text-stone-900 text-xs active:scale-90"
                                  >
                                    -
                                  </button>
                                  <span className="text-xs font-bold text-stone-900 dark:text-stone-100 w-4 text-center">
                                    {item.qty}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateQty(item.plant_id || item.name, item.qty + 1)}
                                    className="w-5 h-5 flex items-center justify-center font-bold text-stone-600 dark:text-stone-300 hover:text-stone-900 text-xs active:scale-90"
                                  >
                                    +
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleUpdateQty(item.plant_id || item.name, 0)}
                                  className="text-stone-400 hover:text-red-500 p-1 transition-colors"
                                  title="Remove item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Add Plant Picker Component */}
                        <PlantSearchPicker
                          plants={plants}
                          onSelectPlant={handleAddPlantToDraft}
                          collapsible={true}
                          triggerLabel="+ Add Plant from Catalogue"
                          className="pt-1"
                        />

                        {/* Save & Cancel */}
                        <div className="flex items-center gap-2 pt-2 border-t border-amber-200/60 dark:border-amber-800/40">
                          <button
                            type="button"
                            onClick={() => handleSaveOrderItems(order.id)}
                            disabled={isPending}
                            className="px-3.5 py-1.5 bg-botanical-800 dark:bg-botanical-600 text-white rounded-xl font-bold text-xs hover:bg-botanical-900 transition-colors shadow-2xs"
                          >
                            {isPending ? "Saving…" : "Save Item Changes"}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditing}
                            className="px-3.5 py-1.5 bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-xl font-semibold text-xs hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Read-Only Mode */
                      <div>
                        <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                            Order Items ({order.items ? order.items.length : 0})
                          </span>
                          {canEdit ? (
                            <div className="flex items-center gap-2.5">
                              <button
                                type="button"
                                onClick={() => startEditing(order)}
                                className="text-[11px] font-semibold text-botanical-800 dark:text-botanical-100 hover:text-terracotta transition-colors flex items-center gap-1"
                              >
                                <Pencil className="w-3 h-3" />
                                Edit Items
                              </button>
                              <span className="text-stone-300 dark:text-stone-700">|</span>
                              <button
                                type="button"
                                onClick={() => setCancellingOrder(order)}
                                className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline transition-colors flex items-center gap-1"
                              >
                                <XCircle className="w-3 h-3" />
                                Cancel Order
                              </button>
                            </div>
                          ) : null}
                        </div>

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

                        {!canEdit && (
                          <div className="mt-3 p-3 rounded-xl bg-stone-100 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-2">
                            <Lock className="w-3.5 h-3.5 shrink-0 text-stone-400" />
                            <span>
                              This order is being processed and can no longer be changed directly — contact us on WhatsApp for any modifications.
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Financial Summary */}
                    <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 space-y-1.5 text-xs">
                      <div className="flex justify-between text-stone-600 dark:text-stone-400 font-medium">
                        <span>Subtotal</span>
                        <span className="font-semibold text-stone-900 dark:text-stone-100">
                          {formatINR(order.subtotal)}
                        </span>
                      </div>

                      {discountApplied > 0 && (
                        <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-medium">
                          <span>Discount Applied</span>
                          <span>-{formatINR(discountApplied)}</span>
                        </div>
                      )}

                      {(order.estimated_courier_price != null || order.final_courier_price != null || order.delivery_price != null) && (
                        <div className="flex justify-between text-stone-600 dark:text-stone-400 font-medium">
                          <span>Courier / Shipping</span>
                          <span>{effectiveCourier > 0 ? formatINR(effectiveCourier) : "Free / To be calculated"}</span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-stone-200 dark:border-stone-700 flex justify-between font-heading font-bold text-sm text-stone-900 dark:text-stone-100">
                        <span>Total</span>
                        <span className="text-terracotta dark:text-terracotta font-mono">
                          {formatINR(calculatedTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

            {/* Cancelled Orders Section */}
            {cancelledOrders.length > 0 && (
              <div className="mt-12 pt-8 border-t border-stone-200 dark:border-stone-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-base text-stone-600 dark:text-stone-400 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-stone-400" />
                    Cancelled Orders ({cancelledOrders.length})
                  </h3>
                  <span className="text-xs text-stone-400 font-medium">History on this device</span>
                </div>

                <div className="space-y-4">
                  {cancelledOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white/60 dark:bg-stone-900/40 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-5 space-y-3 opacity-80"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="font-heading font-bold text-sm text-stone-700 dark:text-stone-300">
                            {order.order_ref}
                          </span>
                          <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded-full">
                            🚫 Cancelled
                          </span>
                        </div>
                        <span className="text-xs text-stone-400">{formatDate(order.created_at)}</span>
                      </div>

                      <ul className="text-xs text-stone-500 dark:text-stone-400 space-y-1">
                        {order.items &&
                          order.items.map((item, idx) => (
                            <li key={idx} className="flex justify-between">
                              <span>
                                {item.name} × {item.qty}
                              </span>
                              <span className="font-mono">{formatINR(item.price * item.qty)}</span>
                            </li>
                          ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Cancel Confirmation Modal */}
      {cancellingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center shrink-0 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg text-stone-900 dark:text-stone-100">
                  Cancel Order {cancellingOrder.order_ref}?
                </h3>
                <span className="text-xs text-stone-400">This action cannot be undone.</span>
              </div>
            </div>

            {cancelError && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-xs font-semibold text-rose-700 dark:text-rose-300">
                {cancelError}
              </div>
            )}

            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              Are you sure you want to cancel order <strong>{cancellingOrder.order_ref}</strong>? This will remove it from active orders.
            </p>

            <div className="flex items-center gap-2 justify-end pt-2 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setCancellingOrder(null)}
                disabled={isPending}
                className="px-4 py-2 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 rounded-xl font-semibold text-xs hover:bg-stone-200 min-h-[38px]"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelOrder}
                disabled={isPending}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 min-h-[38px]"
              >
                {isPending ? "Cancelling…" : "Yes, Cancel Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
