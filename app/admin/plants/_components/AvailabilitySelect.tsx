"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateAvailability } from "../actions";
import type { PlantAvailability } from "@/lib/types";

const LABELS: Record<PlantAvailability, string> = {
  available: "Available",
  limited: "Limited",
  unavailable: "Unavailable",
};

const STYLES: Record<PlantAvailability, string> = {
  available:
    "border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300",
  limited:
    "border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300",
  unavailable:
    "border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300",
};

interface Props {
  plantId: string;
  current: PlantAvailability;
}

export function AvailabilitySelect({ plantId, current }: Props) {
  const router = useRouter();
  const [value, setValue] = useState<PlantAvailability>(current);
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as PlantAvailability;
    setValue(next); // optimistic update
    startTransition(async () => {
      try {
        await updateAvailability(plantId, next);
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to update availability");
        setValue(current); // revert on error
      }
    });
  }

  return (
    <select
      value={value}
      onChange={handleChange}
      disabled={isPending}
      className={`appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2378716c%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1rem_1rem] bg-[right_0.65rem_center] bg-no-repeat pl-3 pr-8 py-1.5 min-h-[36px] text-xs font-bold rounded-xl border shadow-2xs focus:outline-none focus:ring-2 focus:ring-terracotta disabled:opacity-60 cursor-pointer transition-all ${STYLES[value]}`}
    >
      {(Object.keys(LABELS) as PlantAvailability[]).map((v) => (
        <option
          key={v}
          value={v}
          className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 py-1 font-medium"
        >
          {LABELS[v]}
        </option>
      ))}
    </select>
  );
}
