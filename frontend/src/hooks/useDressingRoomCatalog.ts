import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface DressingRoomCatalogProduct {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  category: string;
  slug: string;
  is_active: boolean;
}

export interface DressingRoomCategory {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  display_order: number;
  is_active: boolean;
}

/**
 * Hook: Fetch dressing room categories
 */
export function useDressingRoomCategories() {
  return useQuery({
    queryKey: ['dressing-room-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dressing_room_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return (data || []) as DressingRoomCategory[];
    },
  });
}

/**
 * Hook: Fetch subcategories for a parent category
 */
export function useDressingRoomSubcategories(parentId?: number) {
  return useQuery({
    queryKey: ['dressing-room-subcategories', parentId],
    queryFn: async () => {
      if (!parentId) return [];

      const { data, error } = await supabase
        .from('dressing_room_categories')
        .select('*')
        .eq('parent_id', parentId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return (data || []) as DressingRoomCategory[];
    },
    enabled: !!parentId,
  });
}

/**
 * Hook: Fetch dressing room products from dressing_room_products table
 */
export function useDressingRoomCatalog() {
  return useQuery({
    queryKey: ['dressing-room-catalog'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dressing_room_products')
        .select('id, name, description, image_url, category, slug, is_active')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return (data || []) as DressingRoomCatalogProduct[];
    },
  });
}

/**
 * Hook: Fetch product variants for dressing room catalog
 */
export function useDressingRoomCatalogVariants(productId?: number) {
  return useQuery({
    queryKey: ['dressing-room-catalog-variants', productId],
    queryFn: async () => {
      if (!productId) return [];

      const { data, error } = await supabase
        .from('dressing_room_product_variants')
        .select('id, name, sku, price, total_quantity, available_quantity, is_active')
        .eq('dressing_room_product_id', productId)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!productId,
  });
}
