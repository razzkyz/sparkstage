import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { supabasePaginatedFetcher, createQuerySignal } from '../lib/fetchers';
import { queryKeys } from '../lib/queryKeys';

export interface ProductSummary {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image?: string;
  images?: string[];
  badge?: string;
  placeholder?: string;
  categorySlug?: string | null;
  defaultVariantId?: number;
  defaultVariantName?: string;
}

export interface ProductPickerOption {
  id: number;
  name: string;
  price: number;
  image?: string;
  placeholder?: string;
  categorySlug?: string | null;
}

export type Product = ProductSummary;

type ProductRow = {
  id: unknown;
  name?: unknown;
  description?: unknown;
  price?: unknown;
  stock?: unknown;
  image?: unknown;
  retail_categories?: { slug?: unknown; is_active?: unknown } | null;
};

const toNumber = (value: unknown, fallback = 0) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

function transformProductSummary(row: ProductRow): ProductSummary {
  const price = toNumber(row.price, 0);
  const image = typeof row.image === 'string' && row.image.trim() !== '' ? row.image : undefined;
  
  return {
    id: toNumber(row.id, 0),
    name: typeof row.name === 'string' ? row.name : String(row.name ?? ''),
    description: typeof row.description === 'string' ? row.description : String(row.description ?? ''),
    price,
    image,
    images: image ? [image] : undefined,
    placeholder: image ? undefined : 'inventory_2',
    categorySlug: typeof row.retail_categories?.slug === 'string' ? row.retail_categories.slug : null,
    defaultVariantId: toNumber(row.id, 0), // product is the variant
    defaultVariantName: 'Default',
  };
}

function transformProductPickerOption(row: ProductRow): ProductPickerOption {
  const price = toNumber(row.price, 0);
  const image = typeof row.image === 'string' && row.image.trim() !== '' ? row.image : undefined;

  return {
    id: toNumber(row.id, 0),
    name: typeof row.name === 'string' ? row.name : String(row.name ?? ''),
    price,
    image,
    placeholder: image ? undefined : 'inventory_2',
    categorySlug: typeof row.retail_categories?.slug === 'string' ? row.retail_categories.slug : null,
  };
}

async function fetchProductSummaries(signal?: AbortSignal) {
  const { signal: timeoutSignal, cleanup, didTimeout } = createQuerySignal(signal);

  try {
    const rows = await supabasePaginatedFetcher<ProductRow>(
      (from, to) =>
        supabase
          .from('product_retail')
          .select(
            `
            id,
            name,
            description,
            price,
            stock,
            image,
            retail_categories!product_retail_retail_category_id_fkey(slug, is_active)
          `
          )
          .abortSignal(timeoutSignal)
          .eq('is_active', true)
          .order('name', { ascending: true })
          .range(from, to),
      1000
    );

    // Filter out products from inactive categories
    return rows
      .filter((row) => {
        const category = Array.isArray(row.retail_categories) ? row.retail_categories[0] : row.retail_categories;
        return !category || category.is_active;
      })
      .map(transformProductSummary);
  } catch (error) {
    if (didTimeout()) {
      throw new Error('Request timeout');
    }
    throw error;
  } finally {
    cleanup();
  }
}

async function fetchProductPickerOptions(signal?: AbortSignal) {
  const { signal: timeoutSignal, cleanup, didTimeout } = createQuerySignal(signal);

  try {
    const rows = await supabasePaginatedFetcher<ProductRow>(
      (from, to) =>
        supabase
          .from('product_retail')
          .select(
            `
            id,
            name,
            price,
            image,
            retail_categories!product_retail_retail_category_id_fkey(slug, is_active)
          `
          )
          .abortSignal(timeoutSignal)
          .eq('is_active', true)
          .order('name', { ascending: true })
          .range(from, to),
      1000
    );

    // Filter out products from inactive categories
    return rows
      .filter((row) => {
        const category = Array.isArray(row.retail_categories) ? row.retail_categories[0] : row.retail_categories;
        return !category || category.is_active;
      })
      .map(transformProductPickerOption);
  } catch (error) {
    if (didTimeout()) {
      throw new Error('Request timeout');
    }
    throw error;
  } finally {
    cleanup();
  }
}

export function useProductSummaries() {
  return useQuery({
    queryKey: queryKeys.productSummaries(),
    queryFn: ({ signal }) => fetchProductSummaries(signal),
    staleTime: 60000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
}

export function useProductPickerOptions() {
  return useQuery({
    queryKey: queryKeys.productPickerOptions(),
    queryFn: ({ signal }) => fetchProductPickerOptions(signal),
    staleTime: 60000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
}

export function useProducts() {
  return useProductSummaries();
}
