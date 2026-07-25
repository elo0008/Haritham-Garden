import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-[#24211E] mb-6">Admin Panel</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Plants Tile */}
        <Link
          href="/admin/plants"
          className="flex items-center gap-4 p-5 bg-white border border-stone-200/80
                     rounded-2xl hover:border-[#C1662F]/50 hover:shadow-md transition-all group"
        >
          <span className="text-3xl p-3 bg-stone-100 rounded-xl">🌿</span>
          <div>
            <div className="text-base font-semibold text-[#24211E] group-hover:text-[#C1662F]">
              Plants
            </div>
            <div className="text-xs text-stone-500 mt-0.5">Manage catalogue &amp; photos</div>
          </div>
        </Link>

        {/* Orders Tile */}
        <Link
          href="/admin/orders"
          className="flex items-center gap-4 p-5 bg-white border border-stone-200/80
                     rounded-2xl hover:border-amber-400/50 hover:shadow-md transition-all group"
        >
          <span className="text-3xl p-3 bg-stone-100 rounded-xl">📦</span>
          <div>
            <div className="text-base font-semibold text-[#24211E] group-hover:text-amber-700">
              Orders
            </div>
            <div className="text-xs text-stone-500 mt-0.5">View &amp; handle customer orders</div>
          </div>
        </Link>

        {/* Hero Banner Tile */}
        <Link
          href="/admin/hero-banner"
          className="flex items-center gap-4 p-5 bg-white border border-stone-200/80
                     rounded-2xl hover:border-violet-400/50 hover:shadow-md transition-all group"
        >
          <span className="text-3xl p-3 bg-stone-100 rounded-xl">🖼️</span>
          <div>
            <div className="text-base font-semibold text-[#24211E] group-hover:text-violet-700">
              Hero Banner
            </div>
            <div className="text-xs text-stone-500 mt-0.5">Homepage promotional banner</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
