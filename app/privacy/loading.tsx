import { DocumentSkeleton } from "@/components/Skeletons";

export default function Loading() {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-100 font-sans pt-24 sm:pt-28 pb-16">
      <DocumentSkeleton />
    </div>
  );
}
