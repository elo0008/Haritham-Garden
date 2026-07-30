"use client";

import { useState } from "react";
import type { Order } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import { TrendingUp, ShoppingBag, Truck, Calendar, DollarSign, PackageX } from "lucide-react";

interface SalesAnalyticsProps {
  orders: Order[];
}

type TimeFilter = "all" | "year" | "month";

export function SalesAnalytics({ orders }: SalesAnalyticsProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Filter orders by timeframe using created_at
  const filteredOrders = orders.filter((order) => {
    try {
      const orderDate = new Date(order.created_at);
      if (timeFilter === "year") {
        return orderDate.getFullYear() === currentYear;
      }
      if (timeFilter === "month") {
        return (
          orderDate.getFullYear() === currentYear &&
          orderDate.getMonth() === currentMonth
        );
      }
      return true; // All Time
    } catch {
      return true;
    }
  });

  // Calculate Revenue Metrics
  const totalRevenue = filteredOrders.reduce((sum, o) => {
    const courier = o.final_courier_price ?? o.delivery_price ?? o.estimated_courier_price ?? 0;
    return sum + (o.final_total || o.subtotal + courier);
  }, 0);

  const completedCount = filteredOrders.length;
  const aov = completedCount > 0 ? totalRevenue / completedCount : 0;

  const totalCourierCollected = filteredOrders.reduce((sum, o) => {
    return sum + (o.final_courier_price ?? o.delivery_price ?? 0);
  }, 0);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8">
      {/* ── 1. Time Filter Tabs ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-1.5 bg-white dark:bg-stone-900 p-1.5 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-2xs">
          <button
            type="button"
            onClick={() => setTimeFilter("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              timeFilter === "all"
                ? "bg-botanical-800 dark:bg-botanical-600 text-white shadow-xs"
                : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
            }`}
          >
            All Time
          </button>
          <button
            type="button"
            onClick={() => setTimeFilter("year")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              timeFilter === "year"
                ? "bg-botanical-800 dark:bg-botanical-600 text-white shadow-xs"
                : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
            }`}
          >
            This Year ({currentYear})
          </button>
          <button
            type="button"
            onClick={() => setTimeFilter("month")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              timeFilter === "month"
                ? "bg-botanical-800 dark:bg-botanical-600 text-white shadow-xs"
                : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
            }`}
          >
            This Month (
            {now.toLocaleDateString("en-IN", { month: "short", year: "numeric" })})
          </button>
        </div>

        <div className="text-xs text-stone-400 dark:text-stone-500 font-medium">
          Filtered by order creation date (`created_at`)
        </div>
      </div>

      {/* ── 2. Revenue Summary Banner (Prominent KPI Cards) ───────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-botanical-900 to-botanical-800 text-white p-6 rounded-3xl shadow-lg border border-botanical-700 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-bl-full pointer-events-none" />
          <span className="text-xs font-semibold uppercase tracking-wider text-botanical-100/80 block mb-1">
            Total Revenue
          </span>
          <div className="font-heading font-bold text-3xl sm:text-4xl text-white mt-1">
            {formatINR(totalRevenue)}
          </div>
          <span className="text-[11px] text-botanical-100/70 mt-2 block">
            Across {completedCount} dispatched order{completedCount !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider block">
              Average Order Value
            </span>
            <div className="font-heading font-bold text-2xl sm:text-3xl text-stone-900 dark:text-stone-100 mt-1">
              {formatINR(aov)}
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
              Per completed sale
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Completed Dispatches Count */}
        <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider block">
              Dispatched Sales
            </span>
            <div className="font-heading font-bold text-2xl sm:text-3xl text-stone-900 dark:text-stone-100 mt-1">
              {completedCount}
            </div>
            <span className="text-[11px] text-blue-600 font-semibold mt-1 block">
              Successful fulfillments
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        {/* Total Courier Charges Collected */}
        <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider block">
              Courier Fees
            </span>
            <div className="font-heading font-bold text-2xl sm:text-3xl text-stone-900 dark:text-stone-100 mt-1">
              {formatINR(totalCourierCollected)}
            </div>
            <span className="text-[11px] text-terracotta font-semibold mt-1 block">
              Shipping revenue
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-terracotta flex items-center justify-center shrink-0">
            <Truck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ── 3. Sales Ledger Table ─────────────────────────────────────────── */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 p-6 sm:p-8 shadow-2xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-heading font-bold text-xl text-stone-900 dark:text-stone-100">
              Sales Ledger
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Itemized financial breakdown of completed orders, newest first.
            </p>
          </div>
          <span className="text-xs font-bold text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-3 py-1 rounded-full">
            {completedCount} {completedCount === 1 ? "Record" : "Records"}
          </span>
        </div>

        {filteredOrders.length === 0 ? (
          /* Empty State */
          <div className="rounded-2xl border border-dashed border-stone-300 dark:border-stone-800 p-12 text-center text-stone-400 dark:text-stone-500">
            <PackageX className="w-10 h-10 mx-auto mb-2 text-stone-300 dark:text-stone-600" />
            <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">
              No completed sales found
            </p>
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
              There are no dispatched orders in the selected timeframe (
              {timeFilter === "all"
                ? "All Time"
                : timeFilter === "year"
                ? `Year ${currentYear}`
                : `Month of ${now.toLocaleDateString("en-IN", { month: "long" })}`}
              ).
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="border-b border-stone-100 dark:border-stone-800 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                  <th className="pb-3 pl-2">Order Ref</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Customer Name</th>
                  <th className="pb-3">Plant Items</th>
                  <th className="pb-3 text-right">Subtotal</th>
                  {filteredOrders.some((o) => (o.discount_amount_applied ?? 0) > 0) && (
                    <th className="pb-3 text-right">Discount</th>
                  )}
                  <th className="pb-3 text-right">Courier</th>
                  <th className="pb-3 text-right pr-2">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-xs font-medium">
                {filteredOrders.map((order) => {
                  const courier =
                    order.final_courier_price ??
                    order.delivery_price ??
                    order.estimated_courier_price ??
                    0;
                  const discountAmt = order.discount_amount_applied ?? 0;
                  const finalTotal = order.final_total || order.subtotal - discountAmt + courier;

                  const itemSummary =
                    order.items && order.items.length > 0
                      ? order.items.map((i) => `${i.qty}x ${i.name}`).join(", ")
                      : "Plant items";

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40 transition-colors"
                    >
                      <td className="py-4 pl-2 font-heading font-bold text-stone-900 dark:text-stone-100">
                        {order.order_ref}
                      </td>
                      <td className="py-4 text-stone-500 dark:text-stone-400 font-mono">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="py-4 text-stone-800 dark:text-stone-200">
                        {order.customer_name ? (
                          <span className="font-semibold">{order.customer_name}</span>
                        ) : (
                          <span className="text-stone-400 italic">WhatsApp Customer</span>
                        )}
                      </td>
                      <td className="py-4 text-stone-600 dark:text-stone-300 max-w-xs truncate">
                        {itemSummary}
                      </td>
                      <td className="py-4 text-right font-mono text-stone-700 dark:text-stone-300">
                        {formatINR(order.subtotal)}
                      </td>
                      {filteredOrders.some((o) => (o.discount_amount_applied ?? 0) > 0) && (
                        <td className="py-4 text-right font-mono text-rose-600 dark:text-rose-400 font-semibold">
                          {discountAmt > 0 ? `−${formatINR(discountAmt)}` : '—'}
                        </td>
                      )}
                      <td className="py-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                        {formatINR(courier)}
                      </td>
                      <td className="py-4 text-right pr-2 font-heading font-bold text-stone-900 dark:text-stone-100 text-sm">
                        {formatINR(finalTotal)}
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
