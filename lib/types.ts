// ── Plant ─────────────────────────────────────────────────────────────────────

export type PlantCategory = 'indoor' | 'outdoor' | 'flowering' | 'fruit' | 'other';
export type PlantSunlight = 'low' | 'medium' | 'full_sun';
export type PlantWatering = 'low' | 'medium' | 'high';
export type PlantAvailability = 'available' | 'limited' | 'unavailable';

export interface Plant {
  id: string;
  name: string;
  local_name: string | null;
  slug: string;
  category: PlantCategory;
  photos: string[];
  description: string | null;
  sunlight: PlantSunlight;
  watering: PlantWatering;
  price: number;
  availability: PlantAvailability;
  shippable: boolean;
  created_at: string;
  updated_at: string;
}

export type PlantWriteData = {
  name: string;
  local_name: string | null;
  category: PlantCategory;
  photos: string[];
  description: string | null;
  sunlight: PlantSunlight;
  watering: PlantWatering;
  price: number;
  availability: PlantAvailability;
  shippable: boolean;
};

// ── Order ─────────────────────────────────────────────────────────────────────

export type OrderItem = {
  plant_id: string;
  name: string;
  price: number;
  qty: number;
};

export interface Order {
  id: string;
  order_ref: string;
  items: OrderItem[];
  subtotal: number;
  delivery_price: number | null;
  final_total: number | null;
  handled: boolean;
  handled_at: string | null;
  deleted: boolean;
  created_at: string;
}
