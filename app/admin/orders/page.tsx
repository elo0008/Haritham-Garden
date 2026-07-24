import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminOrdersList } from "./_components/AdminOrdersList";
import type { Order } from "@/lib/types";

export const metadata = { title: "Orders — Haritham Garden Admin" };

export default async function AdminOrdersPage() {
  const supabase = await createClient();

  // Fetch active non-deleted orders sorted by unhandled first, then created_at DESC
  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .eq("deleted", false)
    .order("handled", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 p-4 text-xs text-red-700">
        Failed to load orders: {error.message}
      </div>
    );
  }

  const typedOrders = (orders as Order[]) || [];
  const unhandledCount = typedOrders.filter((o) => !o.handled).length;

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="text-xs text-stone-500 hover:text-stone-900 transition-colors"
            >
              ← Admin
            </Link>
          </div>
          <h1 className="text-xl font-bold text-[#24211E] mt-1">Orders Management</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            {typedOrders.length} total order{typedOrders.length !== 1 ? "s" : ""}
            {unhandledCount > 0 && (
              <span className="ml-1.5 font-semibold text-amber-700">
                ({unhandledCount} pending)
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Empty State */}
      {typedOrders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300/80 p-12 text-center text-stone-400 bg-white">
          <div className="text-3xl mb-2">📦</div>
          <p className="text-sm font-medium text-stone-700">No active orders</p>
          <p className="text-xs text-stone-400 mt-1">
            New customer WhatsApp order requests will appear here.
          </p>
        </div>
      ) : (
        <AdminOrdersList orders={typedOrders} />
      )}
    </div>
  );
}
