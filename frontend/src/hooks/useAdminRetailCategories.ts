import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
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
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Hook for admin CRUD operations on retail categories
 * 
 * Features:
 * - Fetch all categories (including inactive ones)
 * - Create new categories
 * - Update existing categories
 * - Delete categories
 * 
 * @returns Query response with categories data and mutation functions
 */
export function useAdminRetailCategories() {
  const queryClient = useQueryClient();

  // Fetch all categories (admin sees all, including inactive)
  const categoriesQuery = useQuery({
    queryKey: ['admin-retail-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('retail_categories')
        .select('*')
        .order('department', { ascending: true })
        .order('parent_id', { ascending: true, nullsFirst: true })
        .order('name', { ascending: true });

      if (error) throw new Error(error.message);
      return (data || []) as RetailCategory[];
    },
    staleTime: 60000, // 1 minute
  });

  // Create category
  const createCategory = useMutation({
    mutationFn: async (newCategory: Omit<RetailCategory, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('retail_categories')
        .insert([newCategory])
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return data as RetailCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-retail-categories'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.retailCategories() });
    },
  });

  // Update category
  const updateCategory = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<RetailCategory> }) => {
      const { data, error } = await supabase
        .from('retail_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return data as RetailCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-retail-categories'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.retailCategories() });
    },
  });

  // Delete category
  const deleteCategory = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('retail_categories')
        .delete()
        .eq('id', id);
      
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-retail-categories'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.retailCategories() });
    },
  });

  return {
    categories: categoriesQuery.data ?? [],
    isLoading: categoriesQuery.isLoading,
    error: categoriesQuery.error,
    createCategory: createCategory.mutateAsync,
    isCreating: createCategory.isPending,
    updateCategory: updateCategory.mutateAsync,
    isUpdating: updateCategory.isPending,
    deleteCategory: deleteCategory.mutateAsync,
    isDeleting: deleteCategory.isPending,
  };
}
