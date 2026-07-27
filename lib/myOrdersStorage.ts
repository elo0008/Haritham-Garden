const MY_ORDERS_STORAGE_KEY = "haritham_my_orders";

/**
 * Reads local order UUIDs stored in this browser's localStorage.
 */
export function getLocalOrderUuids(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MY_ORDERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((id): id is string => typeof id === "string" && id.trim().length > 0);
    }
  } catch (e) {
    console.error("Failed to read local order UUIDs from storage", e);
  }
  return [];
}

/**
 * Saves a newly placed order's UUID into this browser's localStorage list.
 */
export function saveLocalOrderUuid(uuid: string): void {
  if (typeof window === "undefined" || !uuid) return;
  try {
    const current = getLocalOrderUuids();
    if (!current.includes(uuid)) {
      const updated = [uuid, ...current];
      localStorage.setItem(MY_ORDERS_STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (e) {
    console.error("Failed to save local order UUID to storage", e);
  }
}
