-- =====================================================
-- Migration: Fix stock filter logic in list_inventory_product_page
-- Created: 2026-07-03
-- Purpose: Fix "In Stock" to show stock > 10, not stock > 0
-- =====================================================

-- Drop and recreate with corrected logic
DROP FUNCTION IF EXISTS public.list_inventory_product_page(text, text, text, text, text, integer, integer);

CREATE OR REPLACE FUNCTION public.list_inventory_product_page(
  p_search_query text default '',
  p_category_slug text default '',
  p_stock_filter text default '',
  p_active_filter text default '',
  p_department_filter text default '',
  p_page integer default 1,
  p_page_size integer default 24
)
RETURNS TABLE(
  product_id bigint,
  total_count bigint
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH filtered_products AS (
    SELECT
      p.id,
      p.name,
      p.is_active,
      COALESCE(
        SUM(
          CASE
            WHEN pv.is_active = false THEN 0
            ELSE greatest(COALESCE(pv.stock, 0) - COALESCE(pv.reserved_stock, 0), 0)
          END
        ),
        0
      ) AS available_stock
    FROM public.products p
    LEFT JOIN public.categories c
      ON c.id = p.category_id
    LEFT JOIN public.retail_categories rc
      ON rc.id = p.retail_category_id
    LEFT JOIN public.product_variants pv
      ON pv.product_id = p.id
    WHERE p.deleted_at IS NULL
      AND (
        COALESCE(p_search_query, '') = ''
        OR p.name ILIKE '%' || p_search_query || '%'
        OR p.sku ILIKE '%' || p_search_query || '%'
        OR EXISTS (
          SELECT 1
          FROM public.product_variants pv_search
          WHERE pv_search.product_id = p.id
            AND pv_search.is_active = true
            AND pv_search.sku ILIKE '%' || p_search_query || '%'
        )
      )
      AND (
        COALESCE(p_category_slug, '') = ''
        OR (COALESCE(p_category_slug, 'uncategorized') = 'uncategorized' AND p.category_id IS NULL AND p.retail_category_id IS NULL)
        OR c.slug = p_category_slug
      )
      AND (
        COALESCE(p_active_filter, '') NOT IN ('active', 'inactive')
        OR (p_active_filter = 'active' AND p.is_active = true)
        OR (p_active_filter = 'inactive' AND p.is_active = false)
      )
      AND (
        COALESCE(p_department_filter, '') IN ('', 'all')
        OR rc.department = p_department_filter
      )
    GROUP BY p.id, p.name, p.is_active
  ),
  stock_filtered_products AS (
    SELECT
      id,
      name,
      is_active
    FROM filtered_products
    WHERE COALESCE(p_stock_filter, '') NOT IN ('in', 'low', 'out')
      OR (p_stock_filter = 'in' AND available_stock > 10)
      OR (p_stock_filter = 'low' AND available_stock > 0 AND available_stock <= 10)
      OR (p_stock_filter = 'out' AND available_stock <= 0)
  )
  SELECT
    id AS product_id,
    COUNT(*) OVER () AS total_count
  FROM stock_filtered_products
  ORDER BY is_active DESC, name ASC, id ASC
  LIMIT greatest(COALESCE(p_page_size, 24), 1)
  OFFSET (greatest(COALESCE(p_page, 1), 1) - 1) * greatest(COALESCE(p_page_size, 24), 1);
$$;

-- Force PostgREST schema reload
NOTIFY pgrst, 'reload schema';
