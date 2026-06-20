import type { InventoryListFilters, ProductRow } from './inventoryTypes';

export const getInventorySelect = (categoryFilter: string, departmentFilter?: string) => {
  const isFilteringByCategory = categoryFilter.trim() !== '' && categoryFilter.trim() !== 'uncategorized';
  const isFilteringByDept = !!departmentFilter && departmentFilter.trim() !== '' && departmentFilter.trim() !== 'all';
  return `
  id,
  name,
  slug,
  description,
  category_id,
  retail_category_id,
  retail_subcategory_id,
  sku,
  is_active,
  deleted_at,
  categories${isFilteringByCategory ? '!inner' : ''}(id, name, slug),
  retail_categories!products_retail_category_id_fkey${isFilteringByDept ? '!inner' : ''}(id, department),
  product_images(image_url, is_primary, display_order),
  product_variants(
    id,
    product_id,
    name,
    sku,
    price,
    stock,
    reserved_stock,
    attributes,
    is_active
  )
`;
};

export const normalizeSearchTerm = (searchQuery: string) =>
  searchQuery
    .trim()
    .replace(/[%_]/g, ' ')
    .replace(/,/g, ' ')
    .replace(/\s+/g, ' ');

export const toNumber = (value: unknown, fallback = 0) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

export const applyInventoryFilters = <T>(query: T, filters: InventoryListFilters): T => {
  let next = query as unknown as {
    or: (filters: string) => unknown;
    eq: (column: string, value: string) => unknown;
    is: (column: string, value: null) => unknown;
  };

  const normalizedSearch = normalizeSearchTerm(filters.searchQuery);
  if (normalizedSearch) {
    next = next.or(`name.ilike.%${normalizedSearch}%,sku.ilike.%${normalizedSearch}%`) as typeof next;
  }

  const normalizedCategory = filters.categoryFilter.trim();
  if (normalizedCategory) {
    if (normalizedCategory === 'uncategorized') {
      next = next.is('category_id', null) as typeof next;
    } else {
      next = next.eq('categories.slug', normalizedCategory) as typeof next;
    }
  }

  const departmentFilter = filters.departmentFilter?.trim();
  if (departmentFilter && departmentFilter !== 'all') {
    next = next.eq('retail_categories.department', departmentFilter) as typeof next;
  }

  return next as unknown as T;
};

export const orderProductsByIds = (products: ProductRow[], productIds: number[]) => {
  const orderMap = new Map<number, number>();
  productIds.forEach((productId, index) => {
    orderMap.set(productId, index);
  });

  return [...products].sort((a, b) => {
    const indexA = orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const indexB = orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    return indexA - indexB;
  });
};
