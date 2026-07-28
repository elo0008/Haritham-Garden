"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAdminToast } from "@/components/AdminToast";
import type { Order, OrderStatus, Plant } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import {
  updateOrderStatus,
  softDeleteOrder,
  updateOrderNotes,
  createManualOrder,
  updateOrderCustomerDetails,
  applyOrderDiscount,
  removeOrderDiscount,
  updateOrderItems,
  type ManualOrderInput,
  type ManualOrderItemInput,
} from "../actions";
import { getEffectivePrice } from "@/lib/types";
import { PlantSearchPicker } from "@/components/PlantSearchPicker";
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
  Pencil,
  Search,
  Tag,
  Percent,
  Lock,
} from "lucide-react";

interface AdminOrdersListProps {
  orders: Order[];
  plants?: Plant[];
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

export function AdminOrdersList({ orders, plants = [] }: AdminOrdersListProps) {
  const router = useRouter();
  const { showToast } = useAdminToast();
  const [isPending, startTransition] = useTransition();

  // Active Filter Tab
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  // Customer Details Modal State
  const [customerModalOrder, setCustomerModalOrder] = useState<Order | null>(null);
  const [isEditingCustomerDetails, setIsEditingCustomerDetails] = useState(false);
  const [customerEditForm, setCustomerEditForm] = useState({
    customer_name: "",
    customer_phone: "",
    customer_address: "",
    customer_pincode: "",
  });

  const openCustomerModal = (order: Order) => {
    setCustomerModalOrder(order);
    setIsEditingCustomerDetails(false);
    setCustomerEditForm({
      customer_name: order.customer_name || "",
      customer_phone: order.customer_phone || "",
      customer_address: order.customer_address || "",
      customer_pincode: order.customer_pincode || "",
    });
  };

  const handleSaveCustomerDetails = () => {
    if (!customerModalOrder) return;
    startTransition(async () => {
      try {
        await updateOrderCustomerDetails(customerModalOrder.id, customerEditForm, customerModalOrder.updated_at);
        setCustomerModalOrder({
          ...customerModalOrder,
          customer_name: customerEditForm.customer_name.trim() || null,
          customer_phone: customerEditForm.customer_phone.trim() || null,
          customer_address: customerEditForm.customer_address.trim() || null,
          customer_pincode: customerEditForm.customer_pincode.trim() || null,
        });
        setIsEditingCustomerDetails(false);
        showToast("Customer Details Saved", `Updated details for ${customerModalOrder.order_ref}`);
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to update customer details");
      }
    });
  };

  // Courier Charge Modal State
  const [courierModalOrder, setCourierModalOrder] = useState<Order | null>(null);
  const [courierTargetStatus, setCourierTargetStatus] = useState<"handled" | "dispatched">("handled");
  const [courierInputValue, setCourierInputValue] = useState<string>("0");
  const [courierModalError, setCourierModalError] = useState<string | null>(null);

  // Manual Order Modal State & Plant Picker
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState<{
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    customerPincode: string;
    status: OrderStatus;
  }>({
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    customerPincode: "",
    status: "pending",
  });
  const [manualEstimatedCourier, setManualEstimatedCourier] = useState<string>("");

  type SelectedManualItem = {
    plant_id: string;
    name: string;
    price: number;
    qty: number;
    photo?: string;
  };

  const [manualSelectedItems, setManualSelectedItems] = useState<SelectedManualItem[]>([]);
  const [manualPlantSearchQuery, setManualPlantSearchQuery] = useState("");
  const [isManualPlantSearchOpen, setIsManualPlantSearchOpen] = useState(false);

  const filteredPlantsForManualOrder = (plants || []).filter((p) =>
    p.name.toLowerCase().includes(manualPlantSearchQuery.toLowerCase().trim())
  );

  const handleAddPlantToManualOrder = (plant: Plant) => {
    if (plant.availability === "unavailable") return;
    const effectivePrice = getEffectivePrice(plant);
    setManualSelectedItems((prev) => {
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
          photo: plant.photos && plant.photos.length > 0 ? plant.photos[0] : undefined,
        },
      ];
    });
    setManualPlantSearchQuery("");
    setIsManualPlantSearchOpen(false);
  };

  const handleUpdateManualItemQty = (plantId: string, newQty: number) => {
    if (newQty <= 0) {
      setManualSelectedItems((prev) => prev.filter((i) => i.plant_id !== plantId));
    } else {
      setManualSelectedItems((prev) =>
        prev.map((i) => (i.plant_id === plantId ? { ...i, qty: newQty } : i))
      );
    }
  };

  const manualSubtotal = manualSelectedItems.reduce(
    (sum, i) => sum + i.price * i.qty,
    0
  );

  const [manualError, setManualError] = useState<string | null>(null);

  // Discount State (for inline editing on order cards)
  const [discountEditingOrderId, setDiscountEditingOrderId] = useState<string | null>(null);
  const [discountFormType, setDiscountFormType] = useState<'flat' | 'percentage'>('flat');
  const [discountFormValue, setDiscountFormValue] = useState<string>('');

  // Discount State (for manual order modal)
  const [manualDiscountEnabled, setManualDiscountEnabled] = useState(false);
  const [manualDiscountType, setManualDiscountType] = useState<'flat' | 'percentage'>('flat');
  const [manualDiscountValue, setManualDiscountValue] = useState<string>('');

  const manualDiscountAmount = (() => {
    const val = parseFloat(manualDiscountValue);
    if (!manualDiscountEnabled || isNaN(val) || val <= 0) return 0;
    if (manualDiscountType === 'flat') return Math.min(val, manualSubtotal);
    return Math.round((manualSubtotal * (val / 100)) * 100) / 100;
  })();

  // Soft Delete Modal State
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);

  // Admin Notes Modal State
  const [editingNoteOrder, setEditingNoteOrder] = useState<Order | null>(null);
  const [noteInput, setNoteInput] = useState<string>("");

  // Order Items Editing State
  const [editingItemsOrderId, setEditingItemsOrderId] = useState<string | null>(null);
  const [editingItemsDraft, setEditingItemsDraft] = useState<SelectedManualItem[]>([]);
  const [editingItemsPlantSearchQuery, setEditingItemsPlantSearchQuery] = useState("");
  const [isEditingItemsPlantSearchOpen, setIsEditingItemsPlantSearchOpen] = useState(false);
  const [editingItemsError, setEditingItemsError] = useState<string | null>(null);

  const [editingOrderUpdatedAt, setEditingOrderUpdatedAt] = useState<string | null>(null);

  const startEditingItems = (order: Order) => {
    setEditingItemsOrderId(order.id);
    setEditingOrderUpdatedAt(order.updated_at || null);
    setEditingItemsError(null);
    setEditingItemsDraft(
      (order.items || []).map((item) => ({
        plant_id: item.plant_id || "",
        name: item.name,
        price: item.price,
        qty: item.qty,
      }))
    );
    setEditingItemsPlantSearchQuery("");
    setIsEditingItemsPlantSearchOpen(false);
  };

  const cancelEditingItems = () => {
    setEditingItemsOrderId(null);
    setEditingOrderUpdatedAt(null);
    setEditingItemsDraft([]);
    setEditingItemsError(null);
    setEditingItemsPlantSearchQuery("");
    setIsEditingItemsPlantSearchOpen(false);
  };

  const handleUpdateEditItemQty = (plantIdOrName: string, newQty: number) => {
    if (newQty <= 0) {
      setEditingItemsDraft((prev) =>
        prev.filter((i) => (i.plant_id ? i.plant_id !== plantIdOrName : i.name !== plantIdOrName))
      );
    } else {
      setEditingItemsDraft((prev) =>
        prev.map((i) =>
          (i.plant_id ? i.plant_id === plantIdOrName : i.name === plantIdOrName)
            ? { ...i, qty: newQty }
            : i
        )
      );
    }
  };

  const handleAddPlantToEditingDraft = (plant: Plant) => {
    if (plant.availability === "unavailable") return;
    const effectivePrice = getEffectivePrice(plant);
    setEditingItemsDraft((prev) => {
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
          photo: plant.photos && plant.photos.length > 0 ? plant.photos[0] : undefined,
        },
      ];
    });
    setEditingItemsPlantSearchQuery("");
    setIsEditingItemsPlantSearchOpen(false);
  };

  const handleSaveOrderItems = (orderId: string) => {
    setEditingItemsError(null);
    if (editingItemsDraft.length === 0) {
      setEditingItemsError("An order must contain at least one plant item.");
      return;
    }

    startTransition(async () => {
      try {
        await updateOrderItems(
          orderId,
          editingItemsDraft.map((i) => ({
            plant_id: i.plant_id,
            name: i.name,
            price: i.price,
            qty: i.qty,
          })),
          editingOrderUpdatedAt
        );
        setEditingItemsOrderId(null);
        setEditingOrderUpdatedAt(null);
        setEditingItemsDraft([]);
        showToast("Order Items Saved", "Updated plant items list");
        router.refresh();
      } catch (err) {
        setEditingItemsError(err instanceof Error ? err.message : "Failed to update order items.");
      }
    });
  };

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
          await updateOrderStatus(order.id, nextStatus, undefined, undefined, order.updated_at);
          showToast("Order Status Updated", `Order ${order.order_ref} set to ${STATUS_CONFIG[nextStatus]?.label || nextStatus}`);
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
          await updateOrderStatus(courierModalOrder.id, "handled", parsed, null, courierModalOrder.updated_at);
          showToast("Courier Fee Saved", `Updated estimated courier fee for ${courierModalOrder.order_ref}`);
        } else {
          await updateOrderStatus(courierModalOrder.id, "dispatched", undefined, parsed, courierModalOrder.updated_at);
          showToast("Order Dispatched", `Final courier fee saved for ${courierModalOrder.order_ref}`);
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
    setManualError(null);

    if (manualSelectedItems.length === 0) {
      setManualError("Please select at least one plant from the catalogue for this order.");
      return;
    }

    startTransition(async () => {
      const parsedCourier =
        manualForm.status !== "pending" && manualEstimatedCourier.trim() !== ""
          ? parseFloat(manualEstimatedCourier)
          : null;

      const res = await createManualOrder({
        customerName: manualForm.customerName,
        customerPhone: manualForm.customerPhone,
        customerAddress: manualForm.customerAddress,
        customerPincode: manualForm.customerPincode,
        items: manualSelectedItems.map((i) => ({
          plant_id: i.plant_id,
          name: i.name,
          price: i.price,
          qty: i.qty,
        })),
        status: manualForm.status,
        estimatedCourierPrice: parsedCourier !== null && !isNaN(parsedCourier) ? parsedCourier : null,
        discountType: manualDiscountEnabled && manualDiscountAmount > 0 ? manualDiscountType : null,
        discountValue: manualDiscountEnabled && manualDiscountAmount > 0 ? parseFloat(manualDiscountValue) : null,
      });

      if (!res.success) {
        setManualError(res.error || "Failed to create manual order.");
      } else {
        showToast("Manual Order Created", "Manual order created successfully");
        setShowManualModal(false);
        setManualSelectedItems([]);
        setManualEstimatedCourier("");
        setManualDiscountEnabled(false);
        setManualDiscountType('flat');
        setManualDiscountValue('');
        setManualForm({
          customerName: "",
          customerPhone: "",
          customerAddress: "",
          customerPincode: "",
          status: "pending",
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
        showToast("Admin Note Saved", `Note updated for ${editingNoteOrder.order_ref}`);
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
        showToast("Order Deleted", `Order ${deletingOrder.order_ref} has been removed`);
        setDeletingOrder(null);
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to delete order");
      }
    });
  };

  // Apply Discount to Order
  const handleApplyDiscount = (orderId: string) => {
    const val = parseFloat(discountFormValue);
    if (isNaN(val) || val <= 0) {
      alert("Please enter a valid discount value greater than 0.");
      return;
    }
    const targetOrder = orders.find((o) => o.id === orderId);
    startTransition(async () => {
      try {
        await applyOrderDiscount(orderId, discountFormType, val, targetOrder?.updated_at);
        showToast("Discount Applied", `Discount added to order ${targetOrder?.order_ref || ''}`);
        setDiscountEditingOrderId(null);
        setDiscountFormValue('');
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to apply discount");
      }
    });
  };

  // Remove Discount from Order
  const handleRemoveDiscount = (orderId: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    startTransition(async () => {
      try {
        await removeOrderDiscount(orderId, targetOrder?.updated_at);
        showToast("Discount Removed", `Discount removed from order ${targetOrder?.order_ref || ''}`);
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to remove discount");
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
            const discountApplied = order.discount_amount_applied ?? 0;
            const calculatedTotal = order.subtotal - discountApplied + effectiveCourier;
            const isEditingDiscount = discountEditingOrderId === order.id;

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

                    {/* Items Edited Indicator */}
                    {order.items_edited_at && (
                      <span
                        className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 px-2 py-0.5 rounded-md flex items-center gap-1"
                        title={`Items edited on ${formatDate(order.items_edited_at)}`}
                      >
                        <Pencil className="w-2.5 h-2.5" />
                        Edited {formatDate(order.items_edited_at)}
                      </span>
                    )}

                    {/* Customer Name Trigger Link/Badge */}
                    {order.customer_name ? (
                      <button
                        type="button"
                        onClick={() => openCustomerModal(order)}
                        className="flex items-center gap-1.5 bg-botanical-50 dark:bg-stone-800 px-3 py-1 rounded-xl border border-botanical-100 dark:border-stone-700 text-xs font-bold text-botanical-800 dark:text-botanical-100 hover:text-terracotta transition-colors"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>{order.customer_name}</span>
                        <span className="text-[11px] underline ml-1">Details</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openCustomerModal(order)}
                        className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 px-3 py-1 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-500 hover:text-terracotta transition-colors"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span className="italic">No customer details</span>
                        <span className="text-[11px] underline ml-1">+ Add</span>
                      </button>
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
                  {/* Items List / Items Edit Mode */}
                  {editingItemsOrderId === order.id ? (
                    <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 space-y-3">
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <span className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                          <Pencil className="w-3.5 h-3.5 text-terracotta" />
                          Edit Order Items
                        </span>
                        <span className="text-[11px] font-semibold text-stone-600 dark:text-stone-300 font-mono">
                          Subtotal: {formatINR(editingItemsDraft.reduce((s, i) => s + i.price * i.qty, 0))}
                        </span>
                      </div>

                      {editingItemsError && (
                        <div className="text-[11px] font-semibold text-red-600 dark:text-red-400">
                          {editingItemsError}
                        </div>
                      )}

                      {/* Items Stepper List */}
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {editingItemsDraft.map((item) => (
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
                                  onClick={() => handleUpdateEditItemQty(item.plant_id || item.name, item.qty - 1)}
                                  className="w-5 h-5 flex items-center justify-center font-bold text-stone-600 dark:text-stone-300 hover:text-stone-900 text-xs active:scale-90"
                                >
                                  -
                                </button>
                                <span className="text-xs font-bold text-stone-900 dark:text-stone-100 w-4 text-center">
                                  {item.qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateEditItemQty(item.plant_id || item.name, item.qty + 1)}
                                  className="w-5 h-5 flex items-center justify-center font-bold text-stone-600 dark:text-stone-300 hover:text-stone-900 text-xs active:scale-90"
                                >
                                  +
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleUpdateEditItemQty(item.plant_id || item.name, 0)}
                                className="text-stone-400 hover:text-red-500 p-1 transition-colors"
                                title="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* + Add Item from Catalogue Picker Component */}
                      <PlantSearchPicker
                        plants={plants || []}
                        onSelectPlant={handleAddPlantToEditingDraft}
                        collapsible={true}
                        triggerLabel="+ Add Item from Catalogue"
                        className="pt-1"
                      />

                      {/* Save & Cancel Actions */}
                      <div className="flex items-center gap-2 pt-2 border-t border-amber-200/60 dark:border-amber-800/40">
                        <button
                          type="button"
                          onClick={() => handleSaveOrderItems(order.id)}
                          disabled={isPending}
                          className="px-3.5 py-1.5 bg-botanical-800 dark:bg-botanical-600 text-white rounded-xl font-bold text-xs hover:bg-botanical-900 transition-colors shadow-2xs"
                        >
                          Save Item Changes
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditingItems}
                          className="px-3.5 py-1.5 bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-xl font-semibold text-xs hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                          Items ({order.items ? order.items.length : 0})
                        </span>
                        {currentStatus === "pending" || currentStatus === "handled" ? (
                          <button
                            type="button"
                            onClick={() => startEditingItems(order)}
                            className="text-[11px] font-semibold text-botanical-800 dark:text-botanical-100 hover:text-terracotta transition-colors flex items-center gap-1"
                          >
                            <Pencil className="w-3 h-3" />
                            Edit Items
                          </button>
                        ) : (
                          <span
                            className="text-[11px] font-medium text-stone-400 dark:text-stone-500 italic flex items-center gap-1"
                            title="Items locked after payment confirmation"
                          >
                            <Lock className="w-3 h-3" />
                            Items locked after payment
                          </span>
                        )}
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
                    </div>
                  )}

                  {/* Financial Breakdown Container */}
                  <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 space-y-1.5 text-xs">
                    <div className="flex justify-between text-stone-600 dark:text-stone-400 font-medium">
                      <span>Subtotal</span>
                      <span className="font-semibold text-stone-900 dark:text-stone-100">
                        {formatINR(order.subtotal)}
                      </span>
                    </div>

                    {/* Discount Line */}
                    {discountApplied > 0 && !isEditingDiscount ? (
                      <div className="flex justify-between items-center text-rose-600 dark:text-rose-400 font-semibold">
                        <span className="flex items-center gap-1.5">
                          <Tag className="w-3 h-3" />
                          Discount
                          {order.discount_type === 'percentage' && order.discount_value
                            ? ` (${order.discount_value}%)`
                            : order.discount_type === 'flat' && order.discount_value
                            ? ` (₹${order.discount_value})`
                            : ''}
                          <button
                            type="button"
                            onClick={() => {
                              setDiscountEditingOrderId(order.id);
                              setDiscountFormType(order.discount_type || 'flat');
                              setDiscountFormValue(String(order.discount_value || ''));
                            }}
                            className="text-stone-400 hover:text-terracotta p-0.5 ml-0.5"
                            title="Edit discount"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveDiscount(order.id)}
                            className="text-stone-400 hover:text-red-500 p-0.5"
                            title="Remove discount"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                        <span>−{formatINR(discountApplied)}</span>
                      </div>
                    ) : !isEditingDiscount ? (
                      /* Collapsed "+ Apply Discount" link */
                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            setDiscountEditingOrderId(order.id);
                            setDiscountFormType('flat');
                            setDiscountFormValue('');
                          }}
                          className="text-[11px] text-stone-400 dark:text-stone-500 hover:text-terracotta dark:hover:text-terracotta transition-colors font-medium flex items-center gap-1"
                        >
                          <Tag className="w-3 h-3" />
                          + Apply Discount
                        </button>
                      </div>
                    ) : null}

                    {/* Inline Discount Edit Form */}
                    {isEditingDiscount && (
                      <div className="p-2.5 rounded-xl bg-rose-50/80 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-800/40 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
                            <button
                              type="button"
                              onClick={() => setDiscountFormType('flat')}
                              className={`px-2.5 py-1.5 text-[11px] font-bold transition-colors ${
                                discountFormType === 'flat'
                                  ? 'bg-terracotta text-white'
                                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                              }`}
                            >
                              ₹ Flat
                            </button>
                            <button
                              type="button"
                              onClick={() => setDiscountFormType('percentage')}
                              className={`px-2.5 py-1.5 text-[11px] font-bold transition-colors ${
                                discountFormType === 'percentage'
                                  ? 'bg-terracotta text-white'
                                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                              }`}
                            >
                              % Percent
                            </button>
                          </div>
                          <input
                            type="number"
                            min="0"
                            step={discountFormType === 'percentage' ? '1' : '0.01'}
                            max={discountFormType === 'percentage' ? '100' : undefined}
                            value={discountFormValue}
                            onChange={(e) => setDiscountFormValue(e.target.value)}
                            placeholder={discountFormType === 'flat' ? 'Amount (₹)' : 'Percent (%)'}
                            className="flex-1 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-2.5 py-1.5 text-[11px] text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-terracotta w-20"
                            autoFocus
                          />
                        </div>
                        {/* Preview */}
                        {(() => {
                          const val = parseFloat(discountFormValue);
                          if (!isNaN(val) && val > 0) {
                            const previewAmt = discountFormType === 'flat'
                              ? Math.min(val, order.subtotal)
                              : Math.round((order.subtotal * (val / 100)) * 100) / 100;
                            return (
                              <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                                Discount: −{formatINR(previewAmt)} → New Total: {formatINR(order.subtotal - previewAmt + effectiveCourier)}
                              </div>
                            );
                          }
                          return null;
                        })()}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleApplyDiscount(order.id)}
                            disabled={isPending}
                            className="bg-terracotta hover:bg-[#b04a25] text-white px-3 py-1 rounded-lg text-[11px] font-bold disabled:opacity-50"
                          >
                            {isPending ? 'Applying…' : 'Apply'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDiscountEditingOrderId(null);
                              setDiscountFormValue('');
                            }}
                            className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-[11px] font-medium px-2 py-1"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

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
      <AnimatePresence>
        {customerModalOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs"
              onClick={() => setCustomerModalOrder(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative z-10 w-full max-w-sm rounded-3xl bg-white dark:bg-stone-900 p-6 shadow-xl text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800"
            >
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

              {!isEditingCustomerDetails ? (
                /* Read-only view */
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-stone-400 font-medium block">Full Name:</span>
                    <span className="font-bold text-stone-800 dark:text-stone-200 text-sm">
                      {customerModalOrder.customer_name || "Not provided"}
                    </span>
                  </div>

                  <div>
                    <span className="text-stone-400 font-medium block">Phone Number:</span>
                    <span className="font-mono text-stone-800 dark:text-stone-200">
                      {customerModalOrder.customer_phone || "Not provided"}
                    </span>
                  </div>

                  <div>
                    <span className="text-stone-400 font-medium block">Delivery Address:</span>
                    <span className="text-stone-800 dark:text-stone-200">
                      {customerModalOrder.customer_address || "Not provided"}
                    </span>
                  </div>

                  <div>
                    <span className="text-stone-400 font-medium block">Pincode:</span>
                    <span className="font-mono text-stone-800 dark:text-stone-200">
                      {customerModalOrder.customer_pincode || "Not provided"}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => setIsEditingCustomerDetails(true)}
                      className="text-terracotta hover:underline text-xs font-semibold flex items-center gap-1"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Edit Customer Details</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomerModalOrder(null)}
                      className="px-3 py-1.5 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-semibold"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                /* Edit Form */
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={customerEditForm.customer_name}
                      onChange={(e) => setCustomerEditForm({ ...customerEditForm, customer_name: e.target.value })}
                      className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-botanical-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={customerEditForm.customer_phone}
                      onChange={(e) => setCustomerEditForm({ ...customerEditForm, customer_phone: e.target.value })}
                      className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-botanical-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Delivery Address
                    </label>
                    <textarea
                      rows={2}
                      value={customerEditForm.customer_address}
                      onChange={(e) => setCustomerEditForm({ ...customerEditForm, customer_address: e.target.value })}
                      className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-botanical-600 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Pincode
                    </label>
                    <input
                      type="text"
                      value={customerEditForm.customer_pincode}
                      onChange={(e) => setCustomerEditForm({ ...customerEditForm, customer_pincode: e.target.value })}
                      className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-botanical-600"
                    />
                  </div>

                  <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingCustomerDetails(false)}
                      className="px-3 py-1.5 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveCustomerDetails}
                      disabled={isPending}
                      className="bg-terracotta hover:bg-[#b04a25] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md disabled:opacity-50"
                    >
                      {isPending ? "Saving..." : "Save Details"}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 2: Courier Charge Modal (Estimated or Final) ────────────── */}
      <AnimatePresence>
        {courierModalOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs"
              onClick={() => setCourierModalOrder(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative z-10 w-full max-w-sm rounded-3xl bg-white dark:bg-stone-900 p-6 shadow-xl text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800"
            >
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
                      courierModalOrder.subtotal - (courierModalOrder.discount_amount_applied ?? 0) + (parseFloat(courierInputValue) || 0)
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 3: Add Manual Order Form Modal ──────────────────────────── */}
      <AnimatePresence>
        {showManualModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs"
              onClick={() => setShowManualModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative z-10 w-full max-w-lg rounded-3xl bg-white dark:bg-stone-900 p-6 shadow-xl text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800 max-h-[90vh] overflow-y-auto"
            >
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

                {/* Plant Search & Select Picker */}
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Select Plants from Catalogue <span className="text-red-500">*</span>
                  </label>

                  <PlantSearchPicker
                    plants={plants || []}
                    onSelectPlant={handleAddPlantToManualOrder}
                    collapsible={false}
                    placeholder="Type plant name to search…"
                  />
                </div>

                {/* Selected Items List */}
                {manualSelectedItems.length > 0 ? (
                  <div className="space-y-2">
                    <label className="block font-semibold text-stone-700 dark:text-stone-300">
                      Selected Plants ({manualSelectedItems.length})
                    </label>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {manualSelectedItems.map((item) => (
                        <div
                          key={item.plant_id}
                          className="flex items-center justify-between p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {item.photo ? (
                              <img
                                src={item.photo}
                                alt={item.name}
                                className="w-10 h-10 object-cover rounded-xl border border-stone-200 dark:border-stone-700 shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-sm shrink-0">
                                🌿
                              </div>
                            )}
                            <div className="truncate">
                              <span className="font-bold text-stone-900 dark:text-stone-100 block truncate">
                                {item.name}
                              </span>
                              <span className="text-[11px] text-stone-400 font-mono">
                                {formatINR(item.price)} each
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {/* Quantity Stepper */}
                            <div className="flex items-center gap-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-1.5 py-0.5">
                              <button
                                type="button"
                                onClick={() => handleUpdateManualItemQty(item.plant_id, item.qty - 1)}
                                className="w-5 h-5 flex items-center justify-center font-bold text-stone-600 dark:text-stone-300 hover:text-stone-900 text-xs"
                              >
                                -
                              </button>
                              <span className="font-bold text-xs w-4 text-center text-stone-900 dark:text-stone-100">
                                {item.qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateManualItemQty(item.plant_id, item.qty + 1)}
                                className="w-5 h-5 flex items-center justify-center font-bold text-stone-600 dark:text-stone-300 hover:text-stone-900 text-xs"
                              >
                                +
                              </button>
                            </div>

                            <span className="font-mono font-bold text-xs text-stone-900 dark:text-stone-100 w-16 text-right">
                              {formatINR(item.price * item.qty)}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleUpdateManualItemQty(item.plant_id, 0)}
                              className="p-1 text-stone-400 hover:text-red-500 transition-colors"
                              title="Remove plant"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 text-center border border-dashed border-stone-300 dark:border-stone-700 rounded-2xl text-stone-400 text-xs">
                    No plants selected yet. Search above to add items.
                  </div>
                )}

                {/* Auto-Calculated Subtotal Box & Initial Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div className="rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40 p-3 text-xs text-emerald-950 dark:text-emerald-300">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-[11px]">Auto Subtotal:</span>
                      <span className="font-heading font-bold text-sm text-stone-900 dark:text-stone-100">
                        {formatINR(manualSubtotal)}
                      </span>
                    </div>
                    {manualDiscountAmount > 0 && (
                      <div className="flex justify-between items-center mt-1 text-rose-600 dark:text-rose-400">
                        <span className="font-semibold text-[11px]">
                          Discount ({manualDiscountType === 'percentage' ? `${manualDiscountValue}%` : `₹${manualDiscountValue}`}):
                        </span>
                        <span className="font-bold text-[11px]">−{formatINR(manualDiscountAmount)}</span>
                      </div>
                    )}
                    {manualDiscountAmount > 0 && (
                      <div className="flex justify-between items-center mt-1 pt-1 border-t border-emerald-200/60 dark:border-emerald-800/40">
                        <span className="font-bold text-[11px]">After Discount:</span>
                        <span className="font-heading font-bold text-sm text-stone-900 dark:text-stone-100">
                          {formatINR(manualSubtotal - manualDiscountAmount)}
                        </span>
                      </div>
                    )}
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
                      <option value="handled">2. Handled / Confirmed</option>
                      <option value="paid">3. Paid (Verified)</option>
                      <option value="packaged">4. Packaged</option>
                    </select>
                  </div>
                </div>

                {/* Conditional Estimated Courier Field (shown for Handled, Paid, or Packaged) */}
                {manualForm.status !== "pending" && (
                  <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 space-y-1.5 animate-fadeIn">
                    <label className="block font-semibold text-stone-800 dark:text-stone-200 text-xs">
                      Estimated Courier Charge (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={manualEstimatedCourier}
                      onChange={(e) => setManualEstimatedCourier(e.target.value)}
                      placeholder="e.g. 80"
                      className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-botanical-600 font-mono"
                    />
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                      Courier fee quote provided to customer during phone/in-person sale.
                    </p>
                  </div>
                )}

                {/* Optional Discount (collapsed by default) */}
                {!manualDiscountEnabled ? (
                  <div>
                    <button
                      type="button"
                      onClick={() => setManualDiscountEnabled(true)}
                      className="text-[11px] text-stone-400 dark:text-stone-500 hover:text-terracotta dark:hover:text-terracotta transition-colors font-medium flex items-center gap-1"
                    >
                      <Tag className="w-3 h-3" />
                      + Add Discount
                    </button>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-rose-50/80 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-800/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        Discount
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setManualDiscountEnabled(false);
                          setManualDiscountValue('');
                        }}
                        className="text-stone-400 hover:text-red-500 p-0.5"
                        title="Remove discount"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setManualDiscountType('flat')}
                          className={`px-2.5 py-1.5 text-[11px] font-bold transition-colors ${
                            manualDiscountType === 'flat'
                              ? 'bg-terracotta text-white'
                              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                          }`}
                        >
                          ₹ Flat
                        </button>
                        <button
                          type="button"
                          onClick={() => setManualDiscountType('percentage')}
                          className={`px-2.5 py-1.5 text-[11px] font-bold transition-colors ${
                            manualDiscountType === 'percentage'
                              ? 'bg-terracotta text-white'
                              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                          }`}
                        >
                          % Percent
                        </button>
                      </div>
                      <input
                        type="number"
                        min="0"
                        step={manualDiscountType === 'percentage' ? '1' : '0.01'}
                        max={manualDiscountType === 'percentage' ? '100' : undefined}
                        value={manualDiscountValue}
                        onChange={(e) => setManualDiscountValue(e.target.value)}
                        placeholder={manualDiscountType === 'flat' ? 'Amount (₹)' : 'Percent (%)'}
                        className="flex-1 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-2.5 py-1.5 text-[11px] text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-terracotta w-20"
                      />
                    </div>
                  </div>
                )}

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
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 4: Admin Notes Modal ───────────────────────────────────── */}
      <AnimatePresence>
        {editingNoteOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs"
              onClick={() => setEditingNoteOrder(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative z-10 w-full max-w-md rounded-3xl bg-white dark:bg-stone-900 p-6 shadow-xl text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800"
            >
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 5: Soft Delete Confirmation Modal ───────────────────────── */}
      <AnimatePresence>
        {deletingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs"
              onClick={() => setDeletingOrder(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative z-10 w-full max-w-sm rounded-3xl bg-white dark:bg-stone-900 p-6 shadow-xl text-center text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800"
            >
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
