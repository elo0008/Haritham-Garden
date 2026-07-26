import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Order, OrderStatus } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import {
  Sprout,
  Package,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  LayoutTemplate,
  Plus,
} from "lucide-react";

export const metadata = { title: "Admin Dashboard — Haritham Garden" };

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; bg: string; text: string }
> = {
  pending: { label: "Pending", bg: "bg-amber-100 dark:bg-amber-950/60", text: "text-amber-800 dark:text-amber-300" },
  handled: { label: "Handled", bg: "bg-blue-100 dark:bg-blue-950/60", text: "text-blue-800 dark:text-blue-300" },
  paid: { label: "Paid", bg: "bg-purple-100 dark:bg-purple-950/60", text: "text-purple-800 dark:text-purple-300" },
  packaged: { label: "Packaged", bg: "bg-teal-100 dark:bg-teal-950/60", text: "text-teal-800 dark:text-teal-300" },
  dispatched: { label: "Dispatched", bg: "bg-emerald-100 dark:bg-emerald-950/60", text: "text-emerald-800 dark:text-emerald-300" },
};

export default async function AdminPage() {
  const supabase = await createClient();

  // 1. Fetch Plants Count
  const { data: plantsData } = await supabase
    .from("plants")
    .select("id")
    .eq("deleted", false);
  const totalPlants = plantsData?.length || 0;

  // 2. Fetch Non-Deleted Orders
  const { data: ordersData } = await supabase
    .from("orders")
    .select("*")
    .eq("deleted", false)
    .order("created_at", { ascending: false });

  const allOrders = (ordersData as Order[]) || [];

  // KPI Computations from Real Data
  const activeOrders = allOrders.filter(
    (o) => (o.status || (o.handled ? "dispatched" : "pending")) !== "dispatched"
  );
  const activeOrdersCount = activeOrders.length;

  const dispatchedOrders = allOrders.filter(
    (o) => (o.status || (o.handled ? "dispatched" : "pending")) === "dispatched"
  );
  const completedDispatchesCount = dispatchedOrders.length;

  const totalRevenue = dispatchedOrders.reduce(
    (sum, o) => sum + (o.final_total || o.subtotal || 0),
    0
  );

  // Recent 5 Orders for Preview Table
  const recentOrders = allOrders.slice(0, 5);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl sm:text-3xl text-stone-900 dark:text-stone-100 tracking-tight">
            Admin Control Center
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            Overview of nursery plant catalogue, live orders pipeline, and storefront settings.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/plants/new"
            className="bg-terracotta hover:bg-[#b04a25] text-white px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 shrink-0 min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Plant</span>
          </Link>
        </div>
      </div>

      {/* ── 1. KPI Analytics Ribbon (4 Cards) ──────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* KPI 1: Total Catalogue */}
        <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider block">
              Total Catalogue
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-heading font-bold text-2xl sm:text-3xl text-stone-900 dark:text-stone-100">
                {totalPlants}
              </span>
              <span className="text-xs text-emerald-600 font-semibold">Plants Listed</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-botanical-50 dark:bg-stone-800 text-botanical-800 dark:text-botanical-100 flex items-center justify-center shrink-0">
            <Sprout className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2: Active Orders */}
        <Link
          href="/admin/orders"
          className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800/80 shadow-2xs flex items-center justify-between cursor-pointer hover:border-amber-600 transition-all group"
        >
          <div>
            <span className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider block">
              Active Orders
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-heading font-bold text-2xl sm:text-3xl text-stone-900 dark:text-stone-100">
                {activeOrdersCount}
              </span>
              <span className="text-xs text-amber-600 font-semibold">In Progress</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Package className="w-6 h-6" />
          </div>
        </Link>

        {/* KPI 3: Total Earned All-Time */}
        <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider block">
              Total Earned (All Time)
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-heading font-bold text-2xl sm:text-3xl text-stone-900 dark:text-stone-100">
                {formatINR(totalRevenue)}
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4: Completed Dispatches */}
        <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider block">
              Completed Dispatches
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-heading font-bold text-2xl sm:text-3xl text-stone-900 dark:text-stone-100">
                {completedDispatchesCount}
              </span>
              <span className="text-xs text-emerald-600 font-semibold">Delivered</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ── 2. Three Navigation Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Plants */}
        <Link
          href="/admin/plants"
          className="group bg-white dark:bg-stone-900 rounded-3xl p-7 border border-stone-200/80 dark:border-stone-800/80 shadow-2xs hover:shadow-xl dark:hover:shadow-stone-950/50 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-botanical-50 dark:bg-stone-800/40 rounded-bl-full -z-0 transition-transform group-hover:scale-110 duration-500"></div>
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-botanical-100 dark:bg-stone-800 text-botanical-800 dark:text-botanical-100 flex items-center justify-center mb-6 group-hover:bg-botanical-800 dark:group-hover:bg-botanical-600 group-hover:text-white transition-colors shadow-sm">
              <Sprout className="w-7 h-7" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-botanical-600 dark:text-botanical-100 block mb-1">
              Catalogue Module
            </span>
            <h3 className="font-heading font-bold text-2xl text-stone-900 dark:text-stone-100 group-hover:text-botanical-800 dark:group-hover:text-botanical-100 transition-colors">
              Plants
            </h3>
            <p className="text-stone-500 dark:text-stone-400 text-xs sm:text-sm mt-2 leading-relaxed">
              Manage plant catalogue, pricing, botanical categories, and upload nursery photos.
            </p>
          </div>
          <div className="mt-8 pt-5 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between relative z-10">
            <span className="text-xs font-semibold text-stone-400">
              {totalPlants} {totalPlants === 1 ? "Item" : "Items"} Listed
            </span>
            <span className="text-xs font-bold text-terracotta flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Manage Catalogue <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </Link>

        {/* Card 2: Orders */}
        <Link
          href="/admin/orders"
          className="group bg-white dark:bg-stone-900 rounded-3xl p-7 border border-stone-200/80 dark:border-stone-800/80 shadow-2xs hover:shadow-xl dark:hover:shadow-stone-950/50 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 dark:bg-amber-950/20 rounded-bl-full -z-0 transition-transform group-hover:scale-110 duration-500"></div>
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-stone-800 text-amber-800 dark:text-amber-400 flex items-center justify-center mb-6 group-hover:bg-amber-700 group-hover:text-white transition-colors shadow-sm">
              <Package className="w-7 h-7" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 block mb-1">
              Dispatch Module
            </span>
            <h3 className="font-heading font-bold text-2xl text-stone-900 dark:text-stone-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
              Orders Management
            </h3>
            <p className="text-stone-500 dark:text-stone-400 text-xs sm:text-sm mt-2 leading-relaxed">
              Track 5-stage order fulfillment: verify payments, quote courier charges, and dispatch.
            </p>
          </div>
          <div className="mt-8 pt-5 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between relative z-10">
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md">
              {activeOrdersCount} Active {activeOrdersCount === 1 ? "Order" : "Orders"}
            </span>
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              View Orders <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </Link>

        {/* Card 3: Storefront CMS */}
        <Link
          href="/admin/hero-banner"
          className="group bg-white dark:bg-stone-900 rounded-3xl p-7 border border-stone-200/80 dark:border-stone-800/80 shadow-2xs hover:shadow-xl dark:hover:shadow-stone-950/50 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-terracotta/10 rounded-bl-full -z-0 transition-transform group-hover:scale-110 duration-500"></div>
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-terracotta/15 dark:bg-stone-800 text-terracotta flex items-center justify-center mb-6 group-hover:bg-terracotta group-hover:text-white transition-colors shadow-sm">
              <LayoutTemplate className="w-7 h-7" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-terracotta block mb-1">
              Storefront CMS
            </span>
            <h3 className="font-heading font-bold text-2xl text-stone-900 dark:text-stone-100 group-hover:text-terracotta transition-colors">
              Storefront Banners
            </h3>
            <p className="text-stone-500 dark:text-stone-400 text-xs sm:text-sm mt-2 leading-relaxed">
              Customize homepage hero promotional banner, update seasonal badges, and configure carousels.
            </p>
          </div>
          <div className="mt-8 pt-5 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between relative z-10">
            <span className="text-xs font-semibold text-stone-400">Hero Banner &amp; Carousel</span>
            <span className="text-xs font-bold text-terracotta flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Edit Storefront <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </Link>
      </div>

      {/* ── 3. Recent Orders Preview Table ──────────────────────────────────── */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800/80 p-6 sm:p-8 shadow-2xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-heading font-bold text-lg text-stone-900 dark:text-stone-100">
              Recent Customer Orders
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Latest incoming plant order requests across Kerala and South India.
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-bold text-botanical-800 dark:text-botanical-100 hover:underline flex items-center gap-1"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-400 dark:text-stone-500">
            No orders recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-100 dark:border-stone-800 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                  <th className="pb-3 pl-2">Order Ref</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Plant Items</th>
                  <th className="pb-3">Total</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right pr-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-xs font-medium">
                {recentOrders.map((order) => {
                  const status =
                    order.status || (order.handled ? "dispatched" : "pending");
                  const badge = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
                  const itemSummary =
                    order.items && order.items.length > 0
                      ? order.items.map((i) => `${i.qty}x ${i.name}`).join(", ")
                      : "Items details";

                  const totalVal =
                    order.final_total ||
                    order.subtotal +
                      (order.final_courier_price ?? order.estimated_courier_price ?? 0);

                  return (
                    <tr key={order.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40 transition-colors">
                      <td className="py-4 pl-2 font-heading font-bold text-stone-900 dark:text-stone-100">
                        {order.order_ref}
                      </td>
                      <td className="py-4 text-stone-800 dark:text-stone-200">
                        {order.customer_name ? (
                          <>
                            <span className="font-semibold block">{order.customer_name}</span>
                            {order.customer_phone && (
                              <span className="text-[11px] text-stone-400 font-normal block">
                                {order.customer_phone}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-stone-400 italic">WhatsApp Customer</span>
                        )}
                      </td>
                      <td className="py-4 text-stone-600 dark:text-stone-300 max-w-xs truncate">
                        {itemSummary}
                      </td>
                      <td className="py-4 font-heading font-bold text-stone-900 dark:text-stone-100">
                        {formatINR(totalVal)}
                      </td>
                      <td className="py-4">
                        <span
                          className={`text-[11px] px-2.5 py-1 rounded-full font-bold ${badge.bg} ${badge.text}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-4 text-right pr-2">
                        <Link
                          href="/admin/orders"
                          className="text-xs bg-botanical-50 dark:bg-stone-800 text-botanical-800 dark:text-botanical-100 hover:bg-botanical-800 hover:text-white px-3 py-1.5 rounded-lg font-semibold transition-all"
                        >
                          Manage →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
