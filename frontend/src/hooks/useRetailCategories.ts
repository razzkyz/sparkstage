import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { APIError, createQuerySignal } from '../lib/fetchers';
import { queryKeys } from '../lib/queryKeys';

/**
 * Retail Category interface (from retail_categories table)
 */
export interface RetailCategory {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  department: 'glam' | 'charmbar' | 'sparkclub';
  is_active?: boolean;
}

/**
 * Hook for fetching retail categories (for product_retail)
 * 
 * Features:
 * - Fetches all active retail categories
 * - Supports hierarchical structure (parent_id)
 * - Caches results for 5 minutes
 * 
 * @returns Query response with retail categories data
 * 
 * @example
 * const { data: categories, error, isLoading } = useRetailCategories();
 */
export function useRetailCategories() {
  return useQuery({
    queryKey: queryKeys.retailCategories(),
    queryFn: async ({ signal }) => {
      const { signal: timeoutSignal, cleanup, didTimeout } = createQuerySignal(signal);
      try {
        const { data, error } = await supabase
          .from('retail_categories')
          .select('id, name, slug, parent_id, department')
          .abortSignal(timeoutSignal)
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (error) {
          const err = new Error(error.message) as APIError;
          err.status = error.code === 'PGRST116' ? 404 : 500;
          err.info = error;
          throw err;
        }

        return (data || []) as RetailCategory[];
      } catch (error) {
        if (didTimeout()) {
          throw new Error('Request timeout');
        }
        throw error;
      } finally {
        cleanup();
      }
    },
    staleTime: 300000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
}
