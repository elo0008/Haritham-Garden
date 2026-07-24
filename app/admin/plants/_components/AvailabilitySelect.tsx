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
  available: "border-green-300 bg-green-50 text-green-800",
  limited: "border-yellow-300 bg-yellow-50 text-yellow-800",
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
      className={`text-xs font-medium rounded-md border px-2 py-1
                  focus:outline-none focus:ring-2 focus:ring-green-500
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
