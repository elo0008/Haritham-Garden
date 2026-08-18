"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePlant } from "../actions";
import { useAdminToast } from "@/components/AdminToast";
import { InlineSpinner } from "@/components/Skeletons";

import type { PhotoInput } from "@/lib/types";

interface Props {
  plantId: string;
  plantName: string;
  photoUrls: PhotoInput[];
}

export function DeleteButton({ plantId, plantName, photoUrls }: Props) {
  const router = useRouter();
  const { showToast } = useAdminToast();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Delete "${plantName}"? This cannot be undone.`)) return;

    startTransition(async () => {
      try {
        await deletePlant(plantId, photoUrls);
        showToast("Plant Deleted", `'${plantName}' removed from catalogue`);
        router.refresh();
      } catch (err) {
        alert(
          "Failed to delete plant: " +
            (err instanceof Error ? err.message : "Unknown error")
        );
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="min-h-[44px] flex items-center text-xs text-red-600 hover:text-red-800 font-medium
                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isPending ? (
        <>
          <InlineSpinner className="w-3.5 h-3.5 text-red-600 mr-1.5" />
          <span>Deleting…</span>
        </>
      ) : (
        <span>Delete</span>
      )}
    </button>
  );
}
