import Link from "next/link";

export default function AdminPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
        <Link
          href="/admin/plants"
          className="flex items-center gap-3 p-4 bg-white border border-gray-200
                     rounded-xl hover:border-green-300 hover:bg-green-50 transition-colors group"
        >
          <span className="text-2xl">🌿</span>
          <div>
            <div className="font-medium text-gray-900 group-hover:text-green-700">
              Plants
            </div>
            <div className="text-xs text-gray-400">Manage catalogue</div>
          </div>
        </Link>
        <div
          className="flex items-center gap-3 p-4 bg-gray-50 border border-dashed
                     border-gray-200 rounded-xl opacity-50 cursor-not-allowed"
        >
          <span className="text-2xl">📦</span>
          <div>
            <div className="font-medium text-gray-500">Orders</div>
            <div className="text-xs text-gray-400">Coming soon</div>
          </div>
        </div>
      </div>
    </div>
  );
}
