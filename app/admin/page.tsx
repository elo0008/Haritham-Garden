import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Admin Panel</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Plants Tile */}
        <Link
          href="/admin/plants"
          className="flex items-center gap-4 p-5 bg-white border border-gray-200
                     rounded-2xl hover:border-green-400 hover:shadow-md transition-all group"
        >
          <span className="text-3xl p-3 bg-green-50 rounded-xl">🌿</span>
          <div>
            <div className="text-base font-semibold text-gray-900 group-hover:text-green-700">
              Plants
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Manage catalogue & photos</div>
          </div>
        </Link>

        {/* Orders Tile */}
        <Link
          href="/admin/orders"
          className="flex items-center gap-4 p-5 bg-white border border-gray-200
                     rounded-2xl hover:border-amber-400 hover:shadow-md transition-all group"
        >
          <span className="text-3xl p-3 bg-amber-50 rounded-xl">📦</span>
          <div>
            <div className="text-base font-semibold text-gray-900 group-hover:text-amber-700">
              Orders
            </div>
            <div className="text-xs text-gray-500 mt-0.5">View & handle customer orders</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
