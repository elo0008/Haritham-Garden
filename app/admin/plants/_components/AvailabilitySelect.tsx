"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateAvailability } from "../actions";
import type { PlantAvailability } from "@/lib/types";
import { useAdminToast } from "@/components/AdminToast";
import { CustomDropdown, type CustomDropdownOption } from "@/components/CustomDropdown";

const AVAILABILITY_OPTIONS: CustomDropdownOption<PlantAvailability>[] = [
  {
    value: "available",
    label: "Available",
    badgeBg: "bg-emerald-100 dark:bg-emerald-950/80",
    badgeText: "text-emerald-800 dark:text-emerald-300",
  },
  {
    value: "limited",
    label: "Limited",
    badgeBg: "bg-amber-100 dark:bg-amber-950/80",
    badgeText: "text-amber-800 dark:text-amber-300",
  },
  {
    value: "unavailable",
    label: "Unavailable",
    badgeBg: "bg-rose-100 dark:bg-rose-950/80",
    badgeText: "text-rose-800 dark:text-rose-300",
  },
];

interface Props {
  plantId: string;
  current: PlantAvailability;
}

export function AvailabilitySelect({ plantId, current }: Props) {
  const router = useRouter();
  const { showToast } = useAdminToast();
  const [value, setValue] = useState<PlantAvailability>(current);
  const [isPending, startTransition] = useTransition();

  function handleChange(next: PlantAvailability) {
    setValue(next); // optimistic update
    startTransition(async () => {
      try {
        await updateAvailability(plantId, next);
        const opt = AVAILABILITY_OPTIONS.find((o) => o.value === next);
        showToast("Availability Updated", `Availability set to ${opt?.label || next}`);
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to update availability");
        setValue(current); // revert on error
      }
    });
  }

  return (
    <CustomDropdown
      value={value}
      options={AVAILABILITY_OPTIONS}
      onChange={handleChange}
      disabled={isPending}
      align="left"
      direction="bottom"
      ariaLabel="Change plant availability"
      buttonClassName="!px-3 !py-1.5 !min-h-[36px] !rounded-xl"
    />
  );
}
