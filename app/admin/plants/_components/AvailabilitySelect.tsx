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
  available: "border-emerald-300 bg-emerald-50 text-emerald-800",
  limited: "border-amber-300 bg-amber-50 text-amber-800",
  unavailable: "border-red-300 bg-red-50 text-red-700",
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
      } catch {
        setValue(current); // revert on error
      }
    });
  }

  return (
    <select
      value={value}
      onChange={handleChange}
      disabled={isPending}
      className={`text-xs font-semibold rounded-xl border px-3 py-2 min-h-[38px] sm:min-h-[44px]
                  focus:outline-none focus:ring-2 focus:ring-[#C1662F]
                  disabled:opacity-60 cursor-pointer transition-colors
                  ${STYLES[value]}`}
    >
      {(Object.keys(LABELS) as PlantAvailability[]).map((v) => (
        <option key={v} value={v}>
          {LABELS[v]}
        </option>
      ))}
    </select>
  );
}
