import { OrderListSkeleton } from "@/components/Skeletons";

export default function Loading() {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-100 font-sans pt-24 sm:pt-28 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="space-y-2 mb-8 animate-pulse">
          <div className="h-8 w-48 bg-stone-200 dark:bg-stone-800 rounded-xl" />
          <div className="h-4 w-72 bg-stone-200 dark:bg-stone-800 rounded-lg" />
        </div>
        <OrderListSkeleton count={3} />
      </div>
    </div>
  );
}
