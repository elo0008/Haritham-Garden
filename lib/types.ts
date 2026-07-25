// ── Tag ───────────────────────────────────────────────────────────────────────

export interface Tag {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  created_at: string;
}

// ── Plant ─────────────────────────────────────────────────────────────────────

export type PlantSunlight = 'low' | 'medium' | 'full_sun';
export type PlantWatering = 'low' | 'medium' | 'high';
export type PlantAvailability = 'available' | 'limited' | 'unavailable';

export interface Plant {
  id: string;
  name: string;
  local_name: string | null;
  slug: string;
  photos: string[];
  description: string | null;
  sunlight: PlantSunlight;
  watering: PlantWatering;
  price: number;
  availability: PlantAvailability;
  shippable: boolean;
  created_at: string;
  updated_at: string;
  // Joined from plant_tags → tags (populated by queries that join)
  tags?: Tag[];
}

export type PlantWriteData = {
  name: string;
  local_name: string | null;
  photos: string[];
  description: string | null;
  sunlight: PlantSunlight;
  watering: PlantWatering;
  price: number;
  availability: PlantAvailability;
  shippable: boolean;
};

// ── Cart ──────────────────────────────────────────────────────────────────────

export type CartItem = {
  plant_id: string;
  name: string;
  price: number;
  qty: number;
  photo?: string;
  slug?: string;
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

// ── Hero Banner ──────────────────────────────────────────────────────────────

export interface HeroBanner {
  id: string;
  tag_label: string | null;
  title: string | null;
  description: string | null;
  background_image: string | null;
  active: boolean;
  updated_at: string;
}

// ── Site Settings ────────────────────────────────────────────────────────────

export interface SiteSettings {
  id: string;
  logo_url: string | null;
  business_name: string;
  tagline: string;
  whatsapp_number: string;
  updated_at: string;
}

