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
  sale_price?: number | null;
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
  sale_price?: number | null;
  availability: PlantAvailability;
  shippable: boolean;
};

/**
 * Returns the active/real transactional price for a plant.
 * If sale_price is present and strictly less than regular price, sale_price is returned.
 * Otherwise, regular price is returned.
 */
export function getEffectivePrice(plant: { price: number; sale_price?: number | null }): number {
  if (
    plant.sale_price !== null &&
    plant.sale_price !== undefined &&
    plant.sale_price < plant.price &&
    plant.sale_price >= 0
  ) {
    return plant.sale_price;
  }
  return plant.price;
}

// ── Cart ──────────────────────────────────────────────────────────────────────

export type CartItem = {
  plant_id: string;
  name: string;
  price: number;
  original_price?: number;
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

export interface CustomerDetails {
  name?: string | null;
  phone?: string | null;
  address?: string | null;
  pincode?: string | null;
}

export type OrderStatus = "pending" | "handled" | "paid" | "packaged" | "dispatched";

export interface Order {
  id: string;
  order_ref: string;
  items: OrderItem[];
  subtotal: number;
  delivery_price: number | null;
  estimated_courier_price: number | null;
  final_courier_price: number | null;
  final_total: number | null;
  status: OrderStatus;
  handled: boolean;
  handled_at: string | null;
  deleted: boolean;
  notes: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_address?: string | null;
  customer_pincode?: string | null;
  discount_type?: 'flat' | 'percentage' | null;
  discount_value?: number | null;
  discount_amount_applied?: number | null;
  items_edited_at?: string | null;
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
  location_text?: string | null;
  service_area_text?: string | null;
  instagram_url?: string | null;
  contact_phone?: string | null;
  secondary_social_label?: string | null;
  secondary_social_url?: string | null;
  updated_at: string;
}

// ── Carousel Section ──────────────────────────────────────────────────────────

export interface CarouselSectionSettings {
  id: string;
  enabled: boolean;
  header_tag: string | null;
  header_title: string | null;
  header_subtitle: string | null;
  updated_at: string;
}

export interface CarouselSlide {
  id: string;
  tag_label: string | null;
  title: string;
  description: string;
  background_image: string | null;
  display_order: number;
  active: boolean;
  created_at: string;
}



