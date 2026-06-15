import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { APIError, createQuerySignal } from '../lib/fetchers';
import { queryKeys } from '../lib/queryKeys';

type Variant = {
  id: number;
  name: string;
  price: number;
  available: number;
  imageUrl?: string;
  color?: string;
  size?: string;
};

export type ProductDetail = {
  id: number;
  name: string;
  description: string;
  categoryName?: string;
  imageUrl?: string;
  imageUrls: string[];
  variants: Variant[];
};

export async function fetchProductDetail(numericId: number, signal: AbortSignal): Promise<ProductDetail> {
  const { data, error } = await supabase
    .from('product_retail')
    .select(
      `
          id,
          name,
          description,
          price,
          stock,
          image,
          retail_categories!product_retail_retail_category_id_fkey(name)
        `
    )
    .abortSignal(signal)
    .eq('id', numericId)
    .single();

  if (error || !data) {
    const err = new Error(error?.message || 'Product not found') as APIError;
    err.status = error?.code === 'PGRST116' ? 404 : 500;
    err.info = error;
    throw err;
  }

  const rawData = data as any;
  const imageUrl = rawData.image ? String(rawData.image) : undefined;
  
  const mappedVariants: Variant[] = [
    {
      id: Number(rawData.id),
      name: 'Default',
      price: Number(rawData.price || 0),
      available: Math.max(0, Number(rawData.stock || 0)),
      imageUrl: imageUrl,
    }
  ];

  // Transform category data
  const categoryName = Array.isArray(rawData.retail_categories) 
    ? rawData.retail_categories[0]?.name 
    : rawData.retail_categories?.name;

  return {
    id: Number(rawData.id),
    name: String(rawData.name),
    description: String(rawData.description ?? ''),
    categoryName,
    imageUrl: imageUrl,
    imageUrls: imageUrl ? [imageUrl] : [],
    variants: mappedVariants,
  };
}

export function useProduct(productId: string | undefined) {
  const numericId = Number(productId);
  const enabled = Number.isFinite(numericId);

  return useQuery({
    queryKey: enabled ? queryKeys.product(numericId) : ['product', 'invalid'],
    enabled,
    queryFn: async ({ signal }) => {
      const { signal: timeoutSignal, cleanup, didTimeout } = createQuerySignal(signal);
      try {
        return await fetchProductDetail(numericId, timeoutSignal);
      } catch (error) {
        if (didTimeout()) {
          throw new Error('Request timeout');
        }
        throw error;
      } finally {
        cleanup();
      }
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    staleTime: 60000,
  });
}
