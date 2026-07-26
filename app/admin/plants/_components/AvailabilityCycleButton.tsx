"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateAvailability } from "../actions";
import type { PlantAvailability } from "@/lib/types";
import { RefreshCw, AlertTriangle, XCircle } from "lucide-react";

interface AvailabilityCycleButtonProps {
  plantId: string;
  current: PlantAvailability;
}

const CYCLE_MAP: Record<
  PlantAvailability,
  {
    next: PlantAvailability;
    label: string;
    icon: typeof RefreshCw;
    className: string;
  }
> = {
  available: {
    next: "limited",
    label: "Set Limited",
    icon: AlertTriangle,
    className:
      "bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800",
  },
  limited: {
    next: "unavailable",
    label: "Set Out of Stock",
    icon: XCircle,
    className:
      "bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800",
  },
  unavailable: {
    next: "available",
    label: "Restock",
    icon: RefreshCw,
    className:
      "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
  },
};

export function AvailabilityCycleButton({
  plantId,
  current,
}: AvailabilityCycleButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useState<PlantAvailability | null>(null);

  const status = optimisticStatus ?? current;
  const config = CYCLE_MAP[status];
  const Icon = config.icon;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = config.next;
    setOptimisticStatus(nextState);

    startTransition(async () => {
      try {
        await updateAvailability(plantId, nextState);
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to update availability");
        setOptimisticStatus(null);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs min-h-[36px] ${config.className} ${
        isPending ? "opacity-60 cursor-not-allowed" : "active:scale-95"
      }`}
      title={`Current: ${status.toUpperCase()}. Click to cycle to ${config.next.toUpperCase()}`}
    >
      <Icon className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
      <span>{isPending ? "Updating..." : config.label}</span>
    </button>
  );
}
