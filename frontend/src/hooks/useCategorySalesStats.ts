import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { APIError } from '../lib/fetchers';
import { queryKeys } from '../lib/queryKeys';
import { useEffect } from 'react';
import { toLocalDateString, nowWIB } from '../utils/timezone';

export type CategorySalesStat = {
  categoryId: number | null;
  categoryName: string;
  department: string;
  qtySold: number;
  revenue: number;
};

export type ProductSaleItem = {
  variantId: number | null;
  productId: number | null;
  productName: string;
  variantName: string;
  sku: string;
  qtySold: number;
  revenue: number;
};

export type CategorySalesStats = {
  rows: CategorySalesStat[];
  totalQty: number;
  totalRevenue: number;
  startDate: string;
  endDate: string;
  /** Per-product breakdown keyed by categoryId (as string, 'null' for uncategorized) */
  productItemsByCategory: Record<string, ProductSaleItem[]>;
};

export type CategorySalesParams = {
  startDate?: string; // YYYY-MM-DD in WIB
  endDate?: string;   // YYYY-MM-DD in WIB
};

export function useCategorySalesStats(params?: CategorySalesParams) {
  const queryClient = useQueryClient();

  const now = nowWIB();
  const todayKey = toLocalDateString(now);
  const startDate = params?.startDate ?? todayKey;
  const endDate = params?.endDate ?? todayKey;

  const query = useQuery({
    queryKey: [...queryKeys.categorySalesStats(), startDate, endDate],
    queryFn: async ({ signal }) => {
      // Use explicit WIB (+07:00) offset — PostgreSQL handles UTC conversion correctly.
      const startISO = `${startDate}T00:00:00+07:00`;
      const endISO = `${endDate}T23:59:59.999+07:00`;

      const { data, error } = await supabase
        .from('order_product_items')
        .select(
          `id,
           quantity,
           subtotal,
           product_variant_id,
           product_variants!inner(
             product_id,
             name,
             sku,
             products!inner(
               id,
               name,
               retail_category_id,
               retail_categories!products_retail_category_id_fkey(id, name, department)
             )
           )`
        )
        .abortSignal(signal)
        .gte('created_at', startISO)
        .lte('created_at', endISO);

      if (error) {
        const err = new Error('Gagal memuat data penjualan per kategori') as APIError;
        err.status = 500;
        err.info = error;
        throw err;
      }

      // Maps for category-level and product-level aggregation
      const categoryMap = new Map<
        number | null,
        { categoryName: string; department: string; qtySold: number; revenue: number }
      >();

      // Key: `${categoryId}:::${variantId}`
      const productMap = new Map<
        string,
        ProductSaleItem & { categoryId: number | null }
      >();

      for (const item of data ?? []) {
        const variant = Array.isArray(item.product_variants)
          ? item.product_variants[0]
          : item.product_variants;
        const product = variant
          ? Array.isArray(variant.products)
            ? variant.products[0]
            : variant.products
          : null;
        const catRaw = product
          ? Array.isArray(product.retail_categories)
            ? product.retail_categories[0]
            : product.retail_categories
          : null;

        const categoryId: number | null = catRaw?.id ?? null;
        const categoryName: string = catRaw?.name ?? '(Tanpa Kategori)';
        const department: string = catRaw?.department ?? '-';
        const qty = Number(item.quantity ?? 1);
        const revenue = Number(item.subtotal ?? 0);

        // --- Category aggregation ---
        const existing = categoryMap.get(categoryId);
        if (existing) {
          existing.qtySold += qty;
          existing.revenue += revenue;
        } else {
          categoryMap.set(categoryId, { categoryName, department, qtySold: qty, revenue });
        }

        // --- Product-level aggregation ---
        const variantId: number | null = typeof item.product_variant_id === 'number'
          ? item.product_variant_id
          : null;
        const productId: number | null = product?.id ?? null;
        const productName: string = product?.name ?? '(Produk Tidak Dikenal)';
        const variantName: string = variant?.name ?? '';
        const sku: string = variant?.sku ?? '';
        const productKey = `${String(categoryId)}:::${String(variantId)}`;

        const existingProduct = productMap.get(productKey);
        if (existingProduct) {
          existingProduct.qtySold += qty;
          existingProduct.revenue += revenue;
        } else {
          productMap.set(productKey, {
            variantId,
            productId,
            productName,
            variantName,
            sku,
            qtySold: qty,
            revenue,
            categoryId,
          });
        }
      }

      // Build category rows sorted by revenue desc
      const rows: CategorySalesStat[] = Array.from(categoryMap.entries())
        .map(([categoryId, v]) => ({ categoryId, ...v }))
        .sort((a, b) => b.revenue - a.revenue);

      // Build productItemsByCategory: group product items per category, sorted by revenue desc
      const productItemsByCategory: Record<string, ProductSaleItem[]> = {};
      for (const [, item] of productMap) {
        const key = String(item.categoryId ?? 'null');
        if (!productItemsByCategory[key]) productItemsByCategory[key] = [];
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { categoryId: _cid, ...productItem } = item;
        productItemsByCategory[key].push(productItem);
      }
      for (const key of Object.keys(productItemsByCategory)) {
        productItemsByCategory[key].sort((a, b) => b.revenue - a.revenue);
      }

      const totalQty = rows.reduce((s, r) => s + r.qtySold, 0);
      const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);

      return {
        rows,
        totalQty,
        totalRevenue,
        startDate,
        endDate,
        productItemsByCategory,
      } satisfies CategorySalesStats;
    },
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0,
  });

  // Realtime: auto-invalidate when order_product_items changes
  useEffect(() => {
    let invalidateTimeoutId: ReturnType<typeof setTimeout> | null = null;
    const scheduleInvalidate = () => {
      if (invalidateTimeoutId) return;
      invalidateTimeoutId = setTimeout(() => {
        invalidateTimeoutId = null;
        void queryClient.invalidateQueries({ queryKey: queryKeys.categorySalesStats() });
      }, 700);
    };

    const channel = supabase
      .channel('category_sales_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_product_items' },
        scheduleInvalidate
      )
      .subscribe();

    return () => {
      if (invalidateTimeoutId) clearTimeout(invalidateTimeoutId);
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}
