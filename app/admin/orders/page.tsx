import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminOrdersList } from "./_components/AdminOrdersList";
import type { Order } from "@/lib/types";

export const metadata = { title: "Orders Management — Haritham Garden Admin" };

export default async function AdminOrdersPage() {
  const supabase = await createClient();

  // Fetch active non-deleted orders sorted by created_at DESC
  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .eq("deleted", false)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 dark:bg-red-950/40 p-4 text-xs text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
        Failed to load orders: {error.message}
      </div>
    );
  }

  const typedOrders = (orders as Order[]) || [];

  return (
    <div className="max-w-5xl space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link
            href="/admin"
            className="text-xs font-semibold text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
          >
            ← Admin Dashboard
          </Link>
        </div>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-stone-900 dark:text-stone-100 tracking-tight">
          Orders Pipeline
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
          Track 5-stage order fulfillment, verify courier charges, and add manual phone sales.
        </p>
      </div>

      {/* Orders List Component */}
      <AdminOrdersList orders={typedOrders} />
    </div>
  );
}
