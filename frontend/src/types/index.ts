export interface TicketData {
  id: number;
  slug: string;
  name: string;
  type: string;
  price: string;
  description: string | null;
  available_from: string;
  available_until: string;
  time_slots?: string[] | null;
  is_active: boolean;
}

export interface AboutItem {
  icon: string;
  title: string;
  description: string;
}

export interface CollectionItem {
  title: string;
  subtitle: string;
  imageUrl: string;
}

export interface ProductRetail {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  category_id: number | null;
  price: number;
  stock: number;
  weight: number;
  length: number | null;
  width: number | null;
  height: number | null;
  image: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  retail_category: 'glam' | 'charmbar' | 'sparkclub' | null;
  retail_subcategory_id: number | null;
  variant: string | null;
  imageUrls?: string[];
  product_retail_images?: {
    image_url: string;
    is_primary: boolean;
    display_order: number;
  }[] | null;
  // Relasi opsional — tersedia jika di-select dengan JOIN
  categories?: {
    id: number;
    name: string;
    slug: string;
    is_active: boolean;
  } | null;
  retail_categories?: {
    id: number;
    department: string;
    name: string;
    slug: string;
  } | null;
}
